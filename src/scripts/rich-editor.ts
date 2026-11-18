/**
 * Word-style story editor for the admin, built on Tiptap (ProseMirror).
 * One flowing document with a toolbar: text styles, bold/italic/underline,
 * lists, quotes, links, photos (cropped + compressed on upload) and YouTube
 * videos. Paste from Word/Google Docs keeps headings, bold, lists and links.
 */
import { Editor, Node, type NodeViewRendererProps } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import type { Node as PMNode } from '@tiptap/pm/model';
import { NodeSelection } from '@tiptap/pm/state';
import { $, $$, h, toast, api, fmtBytes, ytThumb, cropImage, uploadCropped, formDialog } from './admin-shared';

function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept: 'image/*' }) as HTMLInputElement;
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
    input.click();
  });
}

function photoDetails(attrs: { alt?: string; caption?: string }, intro?: string, okLabel = 'Save') {
  return formDialog({
    title: 'About this photo',
    intro,
    okLabel,
    fields: [
      { name: 'alt', label: 'Describe the photo', value: attrs.alt, placeholder: 'e.g. Players diving for the ball at Bondi', hint: 'Helps people using screen readers, and Google.' },
      { name: 'caption', label: 'Caption (optional)', value: attrs.caption, placeholder: 'Shown under the photo' },
    ],
  });
}

async function lookupVideo(url: string) {
  const d = await api('GET', `/api/admin/youtube?url=${encodeURIComponent(url)}`);
  return d as { youtubeId: string; title: string };
}

export function initRichEditor(root: HTMLElement, markDirty: () => void, nameHint: () => string) {
  const mount = $('[data-rich-editor]', root)!;
  const json = JSON.parse($('[data-rich-json]', root)!.textContent || '{}');
  let editor: Editor;

  const setAttrsAt = (getPos: NodeViewRendererProps['getPos'], attrs: Record<string, unknown>) => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (typeof pos !== 'number') return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs }));
  };
  const deleteAt = (getPos: NodeViewRendererProps['getPos']) => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (typeof pos !== 'number') return;
    const node = editor.state.doc.nodeAt(pos);
    if (node) editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
    editor.commands.focus();
  };
  const mediaBar = (...buttons: HTMLElement[]) => h('div', { class: 'rich-media__bar', contenteditable: 'false' }, ...buttons);
  const barButton = (label: string, onclick: () => void, danger = false) =>
    h('button', { type: 'button', class: `button${danger ? ' button-danger' : ''}`, onclick }, label);

  /* ---------- Photo node ---------- */
  const Photo = Node.create({
    name: 'photo',
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return { name: { default: null }, src: { default: null }, alt: { default: '' }, caption: { default: '' } };
    },
    parseHTML() {
      return [{
        tag: 'figure[data-photo]',
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return { name: e.dataset.photo, src: e.querySelector('img')?.getAttribute('src'), alt: e.querySelector('img')?.getAttribute('alt') ?? '', caption: e.querySelector('figcaption')?.textContent ?? '' };
        },
      }];
    },
    renderHTML({ node }) {
      return ['figure', { 'data-photo': node.attrs.name }, ['img', { src: node.attrs.src, alt: node.attrs.alt }], ['figcaption', {}, node.attrs.caption || '']];
    },
    addNodeView() {
      return ({ node, getPos }) => {
        let current: PMNode = node;
        const img = h('img', { src: node.attrs.src ?? '', alt: '' }) as HTMLImageElement;
        const cap = h('figcaption', {});
        const sync = () => {
          img.src = current.attrs.src ?? '';
          cap.textContent = current.attrs.caption || (current.attrs.alt ? '' : 'No description yet — click “Caption & description”.');
          cap.classList.toggle('is-missing', !current.attrs.caption && !current.attrs.alt);
        };
        const dom = h('figure', { class: 'rich-media rich-photo' }, img, cap,
          mediaBar(
            barButton('Caption & description', async () => {
              const r = await photoDetails(current.attrs);
              if (r) setAttrsAt(getPos, { alt: r.alt, caption: r.caption });
            }),
            barButton('Replace photo', async () => {
              const file = await pickFile();
              if (!file) return;
              const cropped = await cropImage(file);
              if (!cropped) return;
              try {
                const { name, url } = await uploadCropped(cropped, nameHint());
                setAttrsAt(getPos, { name, src: url });
              } catch (err) { toast((err as Error).message, true); }
            }),
            barButton('Remove', () => deleteAt(getPos), true),
          ),
        );
        sync();
        return {
          dom,
          update: (n) => { if (n.type.name !== 'photo') return false; current = n; sync(); return true; },
          stopEvent: (e) => !!(e.target as HTMLElement).closest?.('.rich-media__bar'),
          ignoreMutation: () => true,
        };
      };
    },
  });

  /* ---------- YouTube video node ---------- */
  const Video = Node.create({
    name: 'video',
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return { youtubeId: { default: null }, title: { default: '' } };
    },
    parseHTML() {
      return [{ tag: 'div[data-youtube]', getAttrs: (el) => ({ youtubeId: (el as HTMLElement).dataset.youtube, title: (el as HTMLElement).dataset.title ?? '' }) }];
    },
    renderHTML({ node }) {
      return ['div', { 'data-youtube': node.attrs.youtubeId, 'data-title': node.attrs.title }, node.attrs.title || 'YouTube video'];
    },
    addNodeView() {
      return ({ node, getPos }) => {
        let current: PMNode = node;
        const img = h('img', { alt: '' }) as HTMLImageElement;
        const title = h('strong', {});
        const sync = () => { img.src = ytThumb(current.attrs.youtubeId); title.textContent = current.attrs.title || 'YouTube video'; };
        const dom = h('div', { class: 'rich-media rich-video' },
          h('div', { class: 'rich-video__thumb' }, img, h('span', { class: 'rich-video__play', 'aria-hidden': 'true' }, '▶')),
          h('div', { class: 'rich-video__info' },
            h('small', {}, 'YouTube video'), title,
            mediaBar(
              barButton('Edit title', async () => {
                const r = await formDialog({ title: 'Video title', fields: [{ name: 'title', label: 'Title', value: current.attrs.title }], okLabel: 'Save' });
                if (r) setAttrsAt(getPos, { title: r.title });
              }),
              barButton('Remove', () => deleteAt(getPos), true),
            )),
        );
        sync();
        return {
          dom,
          update: (n) => { if (n.type.name !== 'video') return false; current = n; sync(); return true; },
          stopEvent: (e) => !!(e.target as HTMLElement).closest?.('.rich-media__bar'),
          ignoreMutation: () => true,
        };
      };
    },
  });

  /* ---------- Actions ---------- */
  // Insert a photo/video as its own block, then put the cursor on a fresh line
  // below it. If a photo/video is currently selected, insert after it rather
  // than replacing it.
  function insertMedia(node: { type: string; attrs: Record<string, unknown> }) {
    const { selection } = editor.state;
    const content = [node, { type: 'paragraph' }];
    const $from = selection.$from;
    // Always insert at the top level (never inside a list or quote).
    if (selection instanceof NodeSelection && $from.depth === 0) {
      editor.chain().focus().insertContentAt(selection.to, content).run();
    } else if ($from.depth >= 1) {
      const top = $from.node(1);
      const range = top.type.name === 'paragraph' && top.content.size === 0
        ? { from: $from.before(1), to: $from.after(1) } // replace an empty line
        : $from.after(1); // otherwise, after the current paragraph/list/quote
      editor.chain().focus().insertContentAt(range, content).run();
    } else {
      editor.chain().focus().insertContent(content).run();
    }
  }

  async function insertPhoto(file?: File | null) {
    file ??= await pickFile();
    if (!file) return;
    const cropped = await cropImage(file);
    if (!cropped) return;
    toast('Uploading photo…');
    let uploaded: { name: string; url: string };
    try {
      uploaded = await uploadCropped(cropped, nameHint());
    } catch (err) {
      toast((err as Error).message || 'Upload failed.', true);
      return;
    }
    const details = await photoDetails({}, `✓ Cropped and optimised: ${fmtBytes(cropped.originalSize)} → ${fmtBytes(cropped.large.size)}`, 'Insert photo');
    insertMedia({ type: 'photo', attrs: { name: uploaded.name, src: uploaded.url, alt: details?.alt ?? '', caption: details?.caption ?? '' } });
  }

  async function insertVideo() {
    let found: { youtubeId: string; title: string } | null = null;
    const r = await formDialog({
      title: 'Add a YouTube video',
      okLabel: 'Insert video',
      fields: [
        { name: 'url', label: 'YouTube link', type: 'url', placeholder: 'https://www.youtube.com/watch?v=…', hint: 'Copy the address from YouTube (or its Share button) and paste it here.' },
        { name: 'title', label: 'Title', hint: 'Filled in automatically from YouTube — change it if you like.' },
      ],
      setup: (inputs) => {
        const look = async () => {
          if (!inputs.url.value.trim()) return;
          try {
            found = await lookupVideo(inputs.url.value);
            if (found.title && !inputs.title.value) inputs.title.value = found.title;
          } catch (err) {
            found = null;
            toast((err as { errors?: string[] }).errors?.[0] ?? 'Couldn’t find that video.', true);
          }
        };
        inputs.url.addEventListener('change', look);
        inputs.url.addEventListener('paste', () => setTimeout(look, 0));
      },
    });
    if (!r) return editor.commands.focus();
    try {
      found ??= await lookupVideo(r.url);
    } catch (err) {
      toast((err as { errors?: string[] }).errors?.[0] ?? 'Couldn’t find that video.', true);
      return;
    }
    insertMedia({ type: 'video', attrs: { youtubeId: found.youtubeId, title: r.title || found.title || 'YouTube video' } });
  }

  async function editLink() {
    const prev = editor.getAttributes('link').href as string | undefined;
    if (editor.state.selection.empty && !prev) {
      toast('First select the words you want to turn into a link.');
      return;
    }
    const r = await formDialog({
      title: prev ? 'Edit link' : 'Add a link',
      okLabel: prev ? 'Update link' : 'Add link',
      extraButton: prev ? { label: 'Remove link', value: 'remove' } : undefined,
      fields: [{ name: 'href', label: 'Web address', value: prev ?? '', placeholder: 'https://… or /events/', hint: 'Paste a full web address, or a page on this site such as /events/ or /youtube/.' }],
    });
    if (!r) return editor.commands.focus();
    if (r._action === 'remove' || !r.href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    let href = r.href;
    if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) href = `https://${href}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  /* ---------- Editor ---------- */
  editor = new Editor({
    element: mount,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https', HTMLAttributes: { target: null, rel: null } },
      }),
      Placeholder.configure({ placeholder: 'Start writing your story… Use the toolbar above for headings, lists, links, photos and videos.' }),
      Photo,
      Video,
    ],
    content: json,
    editorProps: {
      attributes: { class: 'rich__content', 'aria-label': 'Story text', 'aria-multiline': 'true', role: 'textbox' },
      // Pasted Word/Docs headings → our two heading sizes.
      transformPastedHTML: (html) => html.replace(/<(\/?)h1\b/gi, '<$1h2').replace(/<(\/?)h[4-6]\b/gi, '<$1h3'),
      handlePaste: (_view, event) => {
        const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!file) return false;
        insertPhoto(file);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'));
        if (!file) return false;
        event.preventDefault();
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (at) editor.commands.setTextSelection(at.pos);
        insertPhoto(file);
        return true;
      },
    },
    onUpdate: () => markDirty(),
  });

  /* ---------- Toolbar ---------- */
  const toolbar = $('[data-rich-toolbar]', root)!;
  const style = $<HTMLSelectElement>('[data-rich-style]', root)!;
  const actions: Record<string, () => unknown> = {
    bold: () => editor.chain().focus().toggleBold().run(),
    italic: () => editor.chain().focus().toggleItalic().run(),
    underline: () => editor.chain().focus().toggleUnderline().run(),
    bulletList: () => editor.chain().focus().toggleBulletList().run(),
    orderedList: () => editor.chain().focus().toggleOrderedList().run(),
    blockquote: () => editor.chain().focus().toggleBlockquote().run(),
    link: editLink,
    photo: () => insertPhoto(),
    video: insertVideo,
    undo: () => editor.chain().focus().undo().run(),
    redo: () => editor.chain().focus().redo().run(),
  };
  // Keep the text selection when toolbar buttons are pressed.
  toolbar.addEventListener('mousedown', (e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); });
  toolbar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cmd]');
    if (btn) actions[btn.dataset.cmd!]?.();
  });
  style.addEventListener('change', () => {
    const c = editor.chain().focus();
    if (style.value === 'p') c.setParagraph().run();
    else c.setHeading({ level: style.value === 'h3' ? 3 : 2 }).run();
  });

  const refresh = () => {
    for (const btn of $$<HTMLButtonElement>('[data-cmd]', toolbar)) {
      const cmd = btn.dataset.cmd!;
      if (['bold', 'italic', 'underline', 'bulletList', 'orderedList', 'blockquote', 'link'].includes(cmd)) {
        btn.setAttribute('aria-pressed', String(editor.isActive(cmd)));
      }
      if (cmd === 'undo') btn.disabled = !editor.can().undo();
      if (cmd === 'redo') btn.disabled = !editor.can().redo();
    }
    style.value = editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'p';
  };
  editor.on('transaction', refresh);
  refresh();

  // Ctrl/Cmd+K for links.
  mount.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); editLink(); }
  });
  // Clicking the empty part of the page puts the cursor at the end.
  mount.addEventListener('mousedown', (e) => {
    if (e.target === mount) { e.preventDefault(); editor.commands.focus('end'); }
  });

  return () => editor.getJSON();
}
