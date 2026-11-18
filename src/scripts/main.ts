/**
 * Site-wide behaviour. Astro's ClientRouter swaps pages without a full reload,
 * so listeners are attached once (delegated to `document`) and per-page setup
 * runs on every `astro:page-load`.
 */

const embedUrl = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

/* ---------- Sticky header ---------- */
function syncHeader() {
  document.querySelector('[data-header]')?.toggleAttribute('data-scrolled', window.scrollY > 16);
}
window.addEventListener('scroll', syncHeader, { passive: true });

/* ---------- Mobile menu ---------- */
let lastFocus: HTMLElement | null = null;
function setMenu(open: boolean) {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const toggle = document.querySelector<HTMLElement>('[data-menu-open]');
  if (!menu || !toggle) return;
  menu.toggleAttribute('data-open', open);
  menu.inert = !open;
  toggle.setAttribute('aria-expanded', String(open));
  document.documentElement.style.overflow = open ? 'hidden' : '';
  if (open) {
    lastFocus = document.activeElement as HTMLElement;
    menu.querySelector<HTMLElement>('[data-menu-close]')?.focus();
  } else {
    lastFocus?.focus();
  }
}

/* ---------- Scroll reveal ---------- */
let revealObserver: IntersectionObserver | null = null;
function initReveal() {
  revealObserver?.disconnect();
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  els.forEach((el) => revealObserver!.observe(el));
}

/* ---------- Category filters ---------- */
function applyFilter(group: HTMLElement, value: string) {
  const targetSel = group.dataset.filterTarget;
  const target = targetSel ? document.querySelector<HTMLElement>(targetSel) : null;
  if (!target) return;
  group.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.filter === value));
  });
  let shown = 0;
  target.querySelectorAll<HTMLElement>('[data-category]').forEach((item) => {
    const match = value === 'all' || item.dataset.category === value;
    item.hidden = !match;
    if (match) {
      shown++;
      item.classList.add('is-in');
    }
  });
  const empty = document.querySelector<HTMLElement>(`[data-filter-empty="${group.id}"]`);
  if (empty) empty.hidden = shown > 0;
  const status = document.querySelector<HTMLElement>(`[data-filter-status="${group.id}"]`);
  if (status) status.textContent = `Showing ${shown} ${shown === 1 ? 'item' : 'items'}`;
}

function initFilters() {
  const hash = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  document.querySelectorAll<HTMLElement>('[data-filter-group]').forEach((group) => {
    const match = [...group.querySelectorAll<HTMLButtonElement>('[data-filter]')].find(
      (b) => b.dataset.filter!.toLowerCase() === hash,
    );
    if (match) applyFilter(group, match.dataset.filter!);
  });
}

/* ---------- Video: dialog player ---------- */
function openVideoDialog(id: string, title: string) {
  const dialog = document.querySelector<HTMLDialogElement>('[data-video-dialog]');
  if (!dialog) return false;
  const frame = dialog.querySelector<HTMLElement>('[data-video-frame]')!;
  const heading = dialog.querySelector<HTMLElement>('[data-video-heading]')!;
  const yt = dialog.querySelector<HTMLAnchorElement>('[data-video-youtube]');
  heading.textContent = title;
  if (yt) yt.href = `https://www.youtube.com/watch?v=${id}`;
  frame.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl(id);
  iframe.title = title;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  frame.append(iframe);
  dialog.showModal();
  return true;
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const type = params.get('type');
  const subject = params.get('subject');
  const typeSelect = form.elements.namedItem('type') as HTMLSelectElement | null;
  if (type && typeSelect && [...typeSelect.options].some((o) => o.value === type)) typeSelect.value = type;
  const subjectInput = form.elements.namedItem('subject') as HTMLInputElement | null;
  if (subject && subjectInput) subjectInput.value = subject.slice(0, 140);
}

const messages: Record<string, string> = {
  valueMissing: 'This field is required.',
  typeMismatch: 'Please enter a valid email address.',
  tooShort: 'Please add a little more detail.',
};

function validateField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const error = document.getElementById(`${field.id}-error`);
  let msg = '';
  if (!field.validity.valid) {
    const key = (Object.keys(messages) as (keyof ValidityState)[]).find((k) => field.validity[k]);
    msg = key ? messages[key as string] : 'Please check this field.';
  }
  field.setAttribute('aria-invalid', String(Boolean(msg)));
  if (error) error.textContent = msg;
  return !msg;
}

async function submitContact(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const fields = [...form.querySelectorAll<HTMLInputElement>('input:not(.hp input), textarea, select')];
  const valid = fields.map(validateField).every(Boolean);
  if (!valid) {
    fields.find((f) => f.getAttribute('aria-invalid') === 'true')?.focus();
    status.dataset.state = 'error';
    status.textContent = 'Please fix the highlighted fields and try again.';
    return;
  }
  const data = new FormData(form);
  if (data.get('company_website')) return; // honeypot

  const endpoint = form.dataset.endpoint;
  const email = form.dataset.email!;
  const typeLabel = (form.elements.namedItem('type') as HTMLSelectElement).selectedOptions[0]?.text ?? '';

  if (!endpoint) {
    const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nEnquiry: ${typeLabel}\n\n${data.get('message')}`;
    const href = `mailto:${email}?subject=${encodeURIComponent(`[${typeLabel}] ${data.get('subject')}`)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    status.dataset.state = 'success';
    status.textContent = `Your email app should now open with your message ready to send. If it doesn’t, email us directly at ${email}.`;
    return;
  }

  button.disabled = true;
  const label = button.innerHTML;
  button.textContent = 'Sending…';
  try {
    data.delete('company_website');
    data.set('enquiry_type', typeLabel);
    const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    status.dataset.state = 'success';
    status.textContent = 'Thanks — your message is on its way. We’ll get back to you soon.';
  } catch {
    status.dataset.state = 'error';
    status.textContent = `Sorry, something went wrong sending your message. Please email us at ${email}.`;
  } finally {
    button.disabled = false;
    button.innerHTML = label;
    status.focus();
  }
}

/* ---------- Hero ball ---------- */
let heroCleanup: (() => void) | undefined;
async function initHero() {
  heroCleanup?.();
  heroCleanup = undefined;
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-ball]');
  if (!canvas) return;
  const { initHeroBall } = await import('./hero-ball');
  heroCleanup = initHeroBall(canvas);
}

/* ---------- Delegated events (attached once) ---------- */
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  if (target.closest('[data-menu-open]')) return setMenu(true);
  if (target.closest('[data-menu-close]')) return setMenu(false);
  if (target.closest('[data-menu] a')) setMenu(false);

  const filterBtn = target.closest<HTMLButtonElement>('[data-filter]');
  if (filterBtn) {
    const group = filterBtn.closest<HTMLElement>('[data-filter-group]');
    if (group) applyFilter(group, filterBtn.dataset.filter!);
    return;
  }

  const opener = target.closest<HTMLAnchorElement>('[data-video-open]');
  if (opener && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
    if (openVideoDialog(opener.dataset.videoOpen!, opener.dataset.videoTitle || 'Video')) e.preventDefault();
    return;
  }

  if (target.closest('[data-video-close]')) {
    target.closest<HTMLDialogElement>('dialog')?.close();
    return;
  }

  const copy = target.closest<HTMLButtonElement>('[data-copy-link]');
  if (copy) {
    navigator.clipboard?.writeText(location.href).then(() => {
      const label = copy.querySelector('.sr-only');
      copy.setAttribute('data-copied', '');
      if (label) label.textContent = 'Link copied';
      setTimeout(() => {
        copy.removeAttribute('data-copied');
        if (label) label.textContent = 'Copy link';
      }, 2000);
    });
  }
});

// Click on the dialog backdrop closes it; closing always stops playback.
document.addEventListener('click', (e) => {
  const dialog = e.target as HTMLElement;
  if (dialog instanceof HTMLDialogElement && dialog.matches('[data-video-dialog]')) dialog.close();
});
document.addEventListener(
  'close',
  (e) => {
    const dialog = e.target as HTMLElement;
    if (dialog.matches?.('[data-video-dialog]')) dialog.querySelector('[data-video-frame]')!.innerHTML = '';
  },
  true,
);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.querySelector('[data-menu][data-open]')) setMenu(false);
});

document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (form.matches('[data-contact-form]')) {
    e.preventDefault();
    if (form.hasAttribute('data-disabled')) return; // contact switched off for now
    submitContact(form);
  }
});

document.addEventListener(
  'blur',
  (e) => {
    const field = e.target as HTMLInputElement;
    if (field.closest?.('[data-contact-form]') && field.matches('input, textarea, select') && field.value) validateField(field);
  },
  true,
);

/* ---------- Page lifecycle ---------- */
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.add('js');
  document.documentElement.style.overflow = '';
});
document.addEventListener('astro:before-swap', () => {
  heroCleanup?.();
  heroCleanup = undefined;
  revealObserver?.disconnect();
});
document.addEventListener('astro:page-load', () => {
  syncHeader();
  initReveal();
  initFilters();
  initContactForm();
  initHero();
});
