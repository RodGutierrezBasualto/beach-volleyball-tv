/** Shared admin helpers: DOM, dialogs, toasts, API calls, photo cropping & upload. */

/* ===================================================================== */
/* Helpers                                                               */
/* ===================================================================== */
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

export type Attrs = Record<string, string | number | boolean | undefined | ((e: Event) => void)>;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Node | string | null | false)[]) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v as EventListener);
    else if (k === 'value') (el as HTMLInputElement).value = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

let toastTimer = 0;
export function toast(message: string, isError = false) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('is-on'), isError ? 5000 : 2600);
}

export function confirmDialog(title: string, text: string, okLabel = 'Delete'): Promise<boolean> {
  const dialog = $<HTMLDialogElement>('[data-confirm]')!;
  $('[data-confirm-title]', dialog)!.textContent = title;
  $('[data-confirm-text]', dialog)!.textContent = text;
  $('[data-confirm-ok]', dialog)!.textContent = okLabel;
  dialog.returnValue = '';
  dialog.showModal();
  return new Promise((resolve) => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true }));
}

export async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) {
    toast('Your login has expired — please log in again.', true);
    setTimeout(() => (location.href = `/admin/login/?next=${encodeURIComponent(location.pathname)}`), 1500);
    throw new Error('unauthorised');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error('request failed'), { errors: data.errors ?? [data.error ?? 'Something went wrong. Please try again.'] });
  return data;
}

export const fmtBytes = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/* ===================================================================== */
/* Image cropper + compressor                                            */
/* ===================================================================== */
const RATIO = 16 / 10;
const LARGE_W = 1600;
const SMALL_W = 800;

export interface Cropped { large: Blob; small: Blob; widthLarge: number; widthSmall: number; originalSize: number; ratio: number }

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    im.src = url;
  });
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Crops to the site's 16:10 format, or to another shape (e.g. 1 for square). */
export async function cropImage(file: File, ratio = RATIO): Promise<Cropped | null> {
  if (!file.type.startsWith('image/')) {
    toast('Please choose a photo (JPG, PNG or WebP).', true);
    return null;
  }
  let im: HTMLImageElement;
  try {
    im = await loadImage(file);
  } catch {
    toast('Sorry, this photo format can’t be opened here. Please use a JPG or PNG (iPhone photos: share/export as JPG).', true);
    return null;
  }
  const dialog = $<HTMLDialogElement>('[data-cropper]')!;
  const stage = $('[data-crop-stage]', dialog)!;
  const canvas = $<HTMLCanvasElement>('[data-crop-canvas]', dialog)!;
  const zoomEl = $<HTMLInputElement>('[data-crop-zoom]', dialog)!;
  const info = $('[data-crop-info]', dialog)!;
  const warn = $('[data-crop-warn]', dialog)!;
  const ctx = canvas.getContext('2d')!;
  const iw = im.naturalWidth, ih = im.naturalHeight;
  // Other shapes than 16:10 show the whole frame (the dotted safe area is for 16:10 photos).
  const custom = Math.abs(ratio - RATIO) > 0.01;
  stage.style.aspectRatio = custom ? String(ratio) : '';
  stage.style.width = custom ? `min(100%, ${Math.round(55 * ratio)}vh)` : '';
  stage.style.marginInline = custom ? 'auto' : '';
  $<HTMLElement>('.adm-cropper__safe', dialog)!.hidden = custom;
  $<HTMLElement>('[data-crop-safe-note]', dialog)!.hidden = custom;

  dialog.showModal();
  await new Promise(requestAnimationFrame);
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(sw * dpr);
  canvas.height = Math.round(sh * dpr);
  const cover = Math.max(sw / iw, sh / ih);
  let zoom = 1;
  let scale = cover;
  let ox = (sw - iw * scale) / 2;
  let oy = (sh - ih * scale) / 2;
  zoomEl.value = '1';
  info.textContent = `Original: ${iw} × ${ih} px · ${fmtBytes(file.size)}`;

  const clampOffsets = () => {
    ox = Math.min(0, Math.max(sw - iw * scale, ox));
    oy = Math.min(0, Math.max(sh - ih * scale, oy));
  };
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0f1416';
    ctx.fillRect(0, 0, sw, sh);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, ox, oy, iw * scale, ih * scale);
    const srcW = sw / scale;
    warn.hidden = srcW >= 1200;
    warn.textContent = 'Heads up: this photo is quite small, so it may look a little soft on big screens. A larger original will look sharper.';
  };
  const setZoom = (z: number, cx = sw / 2, cy = sh / 2) => {
    zoom = Math.min(4, Math.max(1, z));
    const next = cover * zoom;
    ox = cx - ((cx - ox) / scale) * next;
    oy = cy - ((cy - oy) / scale) * next;
    scale = next;
    zoomEl.value = String(zoom);
    clampOffsets();
    draw();
  };
  draw();

  let drag: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY }; stage.setPointerCapture(e.pointerId); };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    ox += e.clientX - drag.x;
    oy += e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY };
    clampOffsets();
    draw();
  };
  const onUp = () => (drag = null);
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    setZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX - r.left, e.clientY - r.top);
  };
  const onZoom = () => setZoom(Number(zoomEl.value));
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('wheel', onWheel, { passive: false });
  zoomEl.addEventListener('input', onZoom);

  const result = await new Promise<boolean>((resolve) => {
    const ok = () => resolve(true);
    const cancel = () => resolve(false);
    $('[data-crop-ok]', dialog)!.addEventListener('click', ok, { once: true });
    $('[data-crop-cancel]', dialog)!.addEventListener('click', cancel, { once: true });
    dialog.addEventListener('cancel', cancel, { once: true });
  });

  stage.removeEventListener('pointerdown', onDown);
  stage.removeEventListener('pointermove', onMove);
  stage.removeEventListener('pointerup', onUp);
  stage.removeEventListener('wheel', onWheel);
  zoomEl.removeEventListener('input', onZoom);
  dialog.close();
  URL.revokeObjectURL(im.src);
  if (!result) return null;

  // Render the crop at the exact sizes the website uses, then compress.
  const srcX = -ox / scale, srcY = -oy / scale, srcW = sw / scale, srcH = sh / scale;
  const widthLarge = Math.max(480, Math.min(LARGE_W, Math.round(srcW)));
  const out = document.createElement('canvas');
  out.width = widthLarge;
  out.height = Math.round(widthLarge / ratio);
  const octx = out.getContext('2d')!;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(im, srcX, srcY, srcW, srcH, 0, 0, out.width, out.height);

  const widthSmall = Math.min(SMALL_W, widthLarge);
  const small = document.createElement('canvas');
  small.width = widthSmall;
  small.height = Math.round(widthSmall / ratio);
  const sctx = small.getContext('2d')!;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(out, 0, 0, small.width, small.height);

  let large = await encode(out, 'image/webp', 0.82);
  let smallBlob = await encode(small, 'image/webp', 0.8);
  if (!large || large.type !== 'image/webp' || !smallBlob || smallBlob.type !== 'image/webp') {
    // Some browsers (e.g. Safari) can't create WebP — use high-quality JPEG instead.
    large = await encode(out, 'image/jpeg', 0.85);
    smallBlob = await encode(small, 'image/jpeg', 0.82);
  }
  if (!large || !smallBlob) {
    toast('Sorry, the photo couldn’t be processed. Please try another one.', true);
    return null;
  }
  return { large, small: smallBlob, widthLarge, widthSmall, originalSize: file.size, ratio };
}

export async function uploadCropped(c: Cropped, nameHint: string) {
  const ext = c.large.type === 'image/webp' ? 'webp' : 'jpg';
  const fd = new FormData();
  fd.append('large', c.large, `large.${ext}`);
  fd.append('small', c.small, `small.${ext}`);
  fd.append('widthLarge', String(c.widthLarge));
  fd.append('widthSmall', String(c.widthSmall));
  fd.append('ratio', String(c.ratio));
  fd.append('name', nameHint || 'photo');
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Upload failed.');
  return data as { name: string; url: string };
}

/* ===================================================================== */
/* Small form dialog (link, photo details, video)                        */
/* ===================================================================== */
export interface DialogField { name: string; label: string; value?: string; placeholder?: string; hint?: string; type?: string }

export function formDialog(opts: {
  title: string;
  intro?: string;
  fields: DialogField[];
  okLabel?: string;
  extraButton?: { label: string; value: string };
  setup?: (inputs: Record<string, HTMLInputElement>, dialog: HTMLDialogElement) => void;
}): Promise<(Record<string, string> & { _action: string }) | null> {
  const inputs: Record<string, HTMLInputElement> = {};
  const form = h('form', { method: 'dialog' },
    h('h2', {}, opts.title),
    opts.intro ? h('p', {}, opts.intro) : null,
    ...opts.fields.map((f) => {
      const id = `fd-${f.name}-${Math.random().toString(36).slice(2, 7)}`;
      const input = h('input', { id, class: 'control', type: f.type ?? 'text', value: f.value ?? '', placeholder: f.placeholder }) as HTMLInputElement;
      inputs[f.name] = input;
      return h('div', { class: 'field', style: 'margin-top:14px' }, h('label', { for: id }, f.label), input, f.hint ? h('span', { class: 'hint' }, f.hint) : null);
    }),
    h('div', { class: 'adm-dialog__actions' },
      opts.extraButton ? h('button', { class: 'button button-danger', value: opts.extraButton.value, style: 'margin-right:auto' }, opts.extraButton.label) : null,
      h('button', { class: 'button', value: 'cancel', formnovalidate: true }, 'Cancel'),
      h('button', { class: 'button button-primary', value: 'ok' }, opts.okLabel ?? 'OK'),
    ),
  );
  const dialog = h('dialog', { class: 'adm-dialog' }, form) as HTMLDialogElement;
  document.body.append(dialog);
  opts.setup?.(inputs, dialog);
  dialog.showModal();
  Object.values(inputs)[0]?.focus();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      const action = dialog.returnValue;
      dialog.remove();
      if (!action || action === 'cancel') return resolve(null);
      const values = Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value.trim()]));
      resolve({ ...values, _action: action });
    }, { once: true });
  });
}
