import { $, $$, h, toast, confirmDialog, api, fmtBytes, ytThumb, cropImage, uploadCropped, type Attrs } from './admin-shared';

/**
 * Admin interface behaviour: list pages, editors (the news story editor
 * lives in rich-editor.ts), photo pickers and the video library manager.
 */

/* ===================================================================== */
/* Image picker                                                          */
/* ===================================================================== */
function nameHint(from: Element) {
  const form = from.closest('form');
  return (form?.querySelector<HTMLInputElement>('[name="title"]')?.value || 'photo').slice(0, 40);
}

function bindPicker(root: HTMLElement, onChange?: (name: string, url: string) => void) {
  const value = $<HTMLInputElement>('[data-picker-value]', root);
  const file = $<HTMLInputElement>('[data-picker-file]', root)!;
  const drop = $('[data-picker-drop]', root)!;
  const choose = $('[data-picker-choose]', root)!;
  const note = $('[data-picker-note]', root)!;

  const open = () => file.click();
  const handle = async (f?: File | null) => {
    if (!f) return;
    const cropped = await cropImage(f);
    if (!cropped) return;
    const busy = h('div', { class: 'picker__busy' }, 'Uploading…');
    drop.append(busy);
    try {
      const { name, url } = await uploadCropped(cropped, nameHint(root));
      drop.classList.add('has-image');
      $('[data-picker-empty]', drop)?.remove();
      let img = $<HTMLImageElement>('img', drop);
      if (!img) { img = h('img', { alt: '' }); drop.prepend(img); }
      img.src = url;
      choose.textContent = 'Replace photo';
      note.hidden = false;
      note.textContent = `✓ Cropped and optimised: ${fmtBytes(cropped.originalSize)} → ${fmtBytes(cropped.large.size)}`;
      if (value) {
        value.value = name;
        value.dispatchEvent(new Event('input', { bubbles: true }));
      }
      onChange?.(name, url);
    } catch (err) {
      toast((err as Error).message || 'Upload failed. Please try again.', true);
    } finally {
      busy.remove();
      file.value = '';
    }
  };

  choose.addEventListener('click', open);
  drop.addEventListener('click', open);
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  file.addEventListener('change', () => handle(file.files?.[0]));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drop-hover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drop-hover'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('drop-hover');
    handle(e.dataTransfer?.files?.[0]);
  });
}

/* ===================================================================== */
/* List pages (events / news)                                            */
/* ===================================================================== */
function initList(root: HTMLElement) {
  const kind = root.dataset.list!;
  const rows = $$('[data-row]', root);
  const empty = $('[data-empty]', root)!;
  const search = $<HTMLInputElement>('[data-list-search]', root)!;
  const selectAll = $<HTMLInputElement>('[data-select-all]', root)!;
  const bulk = $<HTMLButtonElement>('[data-bulk-delete]', root)!;
  const bulkCount = $('[data-bulk-count]', root)!;
  let filter = 'all';

  const visible = () => rows.filter((r) => !r.hidden);
  const checks = () => rows.map((r) => $<HTMLInputElement>('[data-row-check]', r)!);
  const selected = () => rows.filter((r) => $<HTMLInputElement>('[data-row-check]', r)!.checked);

  const syncBulk = () => {
    const n = selected().length;
    bulk.disabled = n === 0;
    bulk.textContent = n ? `Delete selected (${n})` : 'Delete selected';
    bulkCount.textContent = n ? `${n} selected` : '';
    const vis = visible();
    selectAll.checked = vis.length > 0 && vis.every((r) => $<HTMLInputElement>('[data-row-check]', r)!.checked);
  };
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    rows.forEach((r) => {
      r.hidden = !((filter === 'all' || r.dataset.status === filter) && (!q || r.dataset.search!.includes(q)));
      if (r.hidden) $<HTMLInputElement>('[data-row-check]', r)!.checked = false;
    });
    empty.hidden = visible().length > 0;
    $$('[data-list-filter]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.listFilter === filter)));
    syncBulk();
  };

  $$('[data-list-filter]', root).forEach((b) => b.addEventListener('click', () => { filter = b.dataset.listFilter!; apply(); }));
  search.addEventListener('input', apply);
  selectAll.addEventListener('change', () => { visible().forEach((r) => ($<HTMLInputElement>('[data-row-check]', r)!.checked = selectAll.checked)); syncBulk(); });
  checks().forEach((c) => c.addEventListener('change', syncBulk));
  $('[data-select-past]', root)?.addEventListener('click', () => {
    filter = 'past';
    apply();
    visible().forEach((r) => ($<HTMLInputElement>('[data-row-check]', r)!.checked = true));
    syncBulk();
  });

  const remove = async (slugs: string[], label: string) => {
    const ok = await confirmDialog(
      slugs.length > 1 ? `Delete ${slugs.length} items?` : `Delete “${label}”?`,
      'This permanently removes it from the website. This can’t be undone.',
    );
    if (!ok) return;
    try {
      const { deleted } = await api('DELETE', `/api/admin/${kind}`, { slugs });
      location.href = `/admin/${kind}/?deleted=${deleted}`;
    } catch (err) {
      toast((err as { errors?: string[] }).errors?.[0] ?? 'Delete failed.', true);
    }
  };
  bulk.addEventListener('click', () => remove(selected().map((r) => r.dataset.slug!), ''));
  $$('[data-row-delete]', root).forEach((b) =>
    b.addEventListener('click', () => remove([b.closest<HTMLElement>('[data-row]')!.dataset.slug!], b.dataset.title ?? '')),
  );

  const hash = location.hash.slice(1);
  if ($$('[data-list-filter]', root).some((b) => b.dataset.listFilter === hash)) filter = hash;
  apply();
}

/* ===================================================================== */
/* Editors (events / news)                                               */
/* ===================================================================== */
function initEditor(form: HTMLFormElement) {
  const kind = form.dataset.editor!;
  const originalSlug = form.dataset.originalSlug || undefined;
  const errorsBox = $('[data-errors]')!;
  let dirty = false;
  const markDirty = () => (dirty = true);
  form.addEventListener('input', markDirty);
  form.addEventListener('change', markDirty);
  window.addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });

  $$('[data-image-picker]', form).forEach((p) => bindPicker(p));
  // The Word-style story editor is loaded only where it's needed.
  let getContent: (() => unknown) | null = null;
  const richEl = $('[data-rich]', form);
  if (richEl) {
    import('./rich-editor').then(({ initRichEditor }) => {
      getContent = initRichEditor(richEl, markDirty, () => nameHint(form));
    });
  }

  // Character counters
  $$<HTMLTextAreaElement>('[data-counter]', form).forEach((t) => {
    const max = Number(t.maxLength);
    const c = h('div', { class: 'counter' });
    t.after(c);
    const sync = () => { c.textContent = `${t.value.length} / ${max}`; c.classList.toggle('is-over', t.value.length > max * 0.95); };
    t.addEventListener('input', sync);
    sync();
  });

  const showErrors = (errs: string[]) => {
    errorsBox.replaceChildren(h('b', {}, 'Please fix the following before saving:'), h('ul', {}, ...errs.map((e) => h('li', {}, e))));
    errorsBox.hidden = false;
    errorsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const save = async () => {
    const submit = $<HTMLButtonElement>('button[type="submit"]', form)!;
    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Saving…';
    errorsBox.hidden = true;
    const item: Record<string, unknown> = Object.fromEntries(new FormData(form));
    item.featured = form.querySelector<HTMLInputElement>('[name="featured"]')?.checked ?? false;
    if (richEl) {
      if (!getContent) {
        toast('The editor is still loading — try again in a moment.');
        submit.disabled = false;
        submit.textContent = label;
        return;
      }
      item.content = getContent();
    }
    try {
      const { slug } = await api('POST', `/api/admin/${kind}`, { item, originalSlug });
      dirty = false;
      location.href = `/admin/${kind}/${slug}/?saved=1`;
    } catch (err) {
      const errs = (err as { errors?: string[] }).errors;
      if (errs) showErrors(errs);
      submit.disabled = false;
      submit.textContent = label;
    }
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  });

  $('[data-editor-delete]', form)?.addEventListener('click', async (e) => {
    const title = (e.currentTarget as HTMLElement).dataset.title ?? 'this item';
    if (!(await confirmDialog(`Delete “${title}”?`, 'This permanently removes it from the website. This can’t be undone.'))) return;
    try {
      await api('DELETE', `/api/admin/${kind}`, { slugs: [originalSlug] });
      dirty = false;
      location.href = `/admin/${kind}/?deleted=1`;
    } catch (err) {
      toast((err as { errors?: string[] }).errors?.[0] ?? 'Delete failed.', true);
    }
  });
}

/* ===================================================================== */
/* Video library manager                                                 */
/* ===================================================================== */
type VideoState = { youtubeId: string; title: string; category: string; description: string; image?: string; featured?: boolean; thumb: string };

function initVideos(rowsEl: HTMLElement) {
  const data = JSON.parse($('[data-videos-json]')!.textContent || '{}') as { videos: VideoState[]; categories: string[] };
  let videos = data.videos;
  let dirty = false;
  const dirtyNote = $('[data-dirty-note]')!;
  const cleanNote = $('[data-clean-note]')!;
  const setDirty = (d: boolean) => { dirty = d; dirtyNote.hidden = !d; cleanNote.hidden = d; };
  window.addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });

  const render = () => {
    const count = $('[data-video-count]');
    if (count) count.textContent = `(${videos.length} videos)`;
    rowsEl.replaceChildren(
      ...videos.map((v, i) => {
        const input = (key: 'title' | 'description', attrs: Attrs) => {
          const el = h('input', { class: 'control', type: 'text', value: v[key], ...attrs }) as HTMLInputElement;
          el.addEventListener('input', () => { v[key] = el.value; setDirty(true); });
          return el;
        };
        const cat = h('select', { class: 'control', 'aria-label': 'Category' }, ...data.categories.map((c) => h('option', { selected: c === v.category }, c))) as HTMLSelectElement;
        cat.addEventListener('change', () => { v.category = cat.value; setDirty(true); });
        const feat = h('input', { type: 'radio', name: 'featured-video', checked: !!v.featured }) as HTMLInputElement;
        feat.addEventListener('change', () => { videos.forEach((x) => (x.featured = x === v)); setDirty(true); });
        return h('div', { class: 'video-row' },
          h('a', { href: `https://www.youtube.com/watch?v=${v.youtubeId}`, target: '_blank', rel: 'noopener', title: 'Watch on YouTube' }, h('img', { src: v.thumb, alt: '', loading: 'lazy' })),
          h('div', { class: 'video-row__fields' },
            input('title', { 'aria-label': 'Title', placeholder: 'Title' }),
            input('description', { 'aria-label': 'Short description', placeholder: 'Short description (optional)' }),
            h('div', { class: 'video-row__meta' }, cat, h('label', { class: 'choice' }, feat, h('span', {}, 'Featured')))),
          h('div', { class: 'video-row__ctrl' },
            h('button', { class: 'block__btn', type: 'button', title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, onclick: () => { [videos[i - 1], videos[i]] = [videos[i], videos[i - 1]]; setDirty(true); render(); } }, '↑'),
            h('button', { class: 'block__btn', type: 'button', title: 'Move down', 'aria-label': 'Move down', disabled: i === videos.length - 1, onclick: () => { [videos[i + 1], videos[i]] = [videos[i], videos[i + 1]]; setDirty(true); render(); } }, '↓'),
            h('button', {
              class: 'block__btn block__btn--del', type: 'button', title: 'Remove', 'aria-label': `Remove ${v.title}`,
              onclick: async () => {
                if (!(await confirmDialog(`Remove “${v.title}”?`, 'It will be removed from the website’s video library (not from YouTube).', 'Remove'))) return;
                videos = videos.filter((x) => x !== v);
                setDirty(true);
                render();
              },
            }, '✕')),
        );
      }),
    );
  };
  render();

  // Add a new video
  const urlEl = $<HTMLInputElement>('[data-yt-url]')!;
  const found = $('[data-yt-found]')!;
  let pending: { youtubeId: string } | null = null;
  const lookup = async () => {
    if (!urlEl.value.trim()) return toast('Paste a YouTube link first.');
    try {
      const d = await api('GET', `/api/admin/youtube?url=${encodeURIComponent(urlEl.value)}`);
      if (videos.some((v) => v.youtubeId === d.youtubeId)) return toast('That video is already in the library.', true);
      pending = { youtubeId: d.youtubeId };
      $<HTMLImageElement>('[data-yt-thumb]')!.src = ytThumb(d.youtubeId);
      $<HTMLInputElement>('[data-yt-title]')!.value = d.title || '';
      found.hidden = false;
      $<HTMLInputElement>('[data-yt-title]')!.focus();
    } catch (err) {
      toast((err as { errors?: string[] }).errors?.[0] ?? 'Couldn’t find that video.', true);
    }
  };
  $('[data-yt-lookup]')!.addEventListener('click', lookup);
  urlEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lookup(); } });
  $('[data-yt-add]')!.addEventListener('click', async () => {
    if (!pending) return;
    const title = $<HTMLInputElement>('[data-yt-title]')!.value.trim();
    if (!title) return toast('Please give the video a title.', true);
    videos.unshift({
      youtubeId: pending.youtubeId, title, thumb: ytThumb(pending.youtubeId),
      category: $<HTMLSelectElement>('[data-yt-cat]')!.value,
      description: $<HTMLInputElement>('[data-yt-desc]')!.value.trim(),
    });
    pending = null;
    found.hidden = true;
    urlEl.value = '';
    $<HTMLInputElement>('[data-yt-desc]')!.value = '';
    render();
    await saveAll();
  });

  const saveAll = async () => {
    const btn = $<HTMLButtonElement>('[data-videos-save]')!;
    btn.disabled = true;
    try {
      const { count } = await api('PUT', '/api/admin/videos', { videos });
      setDirty(false);
      toast(`Saved — ${count} videos on the website.`);
    } catch (err) {
      toast((err as { errors?: string[] }).errors?.[0] ?? 'Save failed.', true);
    } finally {
      btn.disabled = false;
    }
  };
  $('[data-videos-save]')!.addEventListener('click', saveAll);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveAll(); }
  });
}

/* ===================================================================== */
/* Boot                                                                  */
/* ===================================================================== */
$$('[data-list]').forEach(initList);
const editorForm = $<HTMLFormElement>('[data-editor]');
if (editorForm) initEditor(editorForm);
const videoRows = $('[data-video-rows]');
if (videoRows) initVideos(videoRows);
