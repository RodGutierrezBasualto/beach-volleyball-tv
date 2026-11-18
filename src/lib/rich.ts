/**
 * Rich-text stories. The admin's Word-style editor (Tiptap) produces a JSON
 * document. On the server it is cleaned against a strict whitelist and
 * rendered to HTML here — raw HTML from the editor is never stored or output.
 */

export interface RichMark { type: string; attrs?: Record<string, unknown> }
export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: RichMark[];
}

const YT_ID = /^[\w-]{11}$/;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function safeHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  const h = href.trim();
  if (!h || h.length > 600) return null;
  if (h.startsWith('/') && !h.startsWith('//')) return h;
  if (h.startsWith('#')) return h;
  if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(h)) return `https://${h}`; // "example.com/page"
  return null;
}

/* ---------- Legacy block format → rich document ---------- */
type LegacyBlock =
  | { type: 'p' | 'h2'; text: string }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; image: string; alt: string; caption?: string }
  | { type: 'video'; youtubeId: string; title: string };

function inlineToNodes(text: string): RichNode[] {
  const out: RichNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m; (m = re.exec(text)); ) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
    out.push({ type: 'text', text: m[1], marks: [{ type: 'link', attrs: { href: m[2] } }] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}

const para = (text: string): RichNode => ({ type: 'paragraph', content: inlineToNodes(text) });

export function blocksToDoc(blocks: LegacyBlock[]): RichNode {
  const content: RichNode[] = blocks.map((b) => {
    switch (b.type) {
      case 'h2': return { type: 'heading', attrs: { level: 2 }, content: inlineToNodes(b.text) };
      case 'quote': return { type: 'blockquote', content: [para(b.text), ...(b.cite ? [para(`— ${b.cite}`)] : [])] };
      case 'list': return { type: 'bulletList', content: b.items.map((i) => ({ type: 'listItem', content: [para(i)] })) };
      case 'image': return { type: 'photo', attrs: { name: b.image, alt: b.alt, caption: b.caption ?? '' } };
      case 'video': return { type: 'video', attrs: { youtubeId: b.youtubeId, title: b.title } };
      default: return para(b.text);
    }
  });
  return { type: 'doc', content };
}

/* ---------- Cleaning (server-side whitelist) ---------- */
const MARKS = new Set(['bold', 'italic', 'underline', 'link']);

function cleanMarks(marks: unknown): RichMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: RichMark[] = [];
  for (const m of marks as RichMark[]) {
    if (!m || !MARKS.has(m.type) || out.some((x) => x.type === m.type)) continue;
    if (m.type === 'link') {
      const href = safeHref(m.attrs?.href);
      if (href) out.push({ type: 'link', attrs: { href } });
    } else out.push({ type: m.type });
  }
  return out.length ? out : undefined;
}

function cleanInline(nodes: unknown): RichNode[] {
  if (!Array.isArray(nodes)) return [];
  const out: RichNode[] = [];
  for (const n of nodes as RichNode[]) {
    if (n?.type === 'text' && typeof n.text === 'string' && n.text) {
      const marks = cleanMarks(n.marks);
      out.push({ type: 'text', text: n.text.slice(0, 20000), ...(marks ? { marks } : {}) });
    } else if (n?.type === 'hardBreak') out.push({ type: 'hardBreak' });
  }
  return out;
}

function cleanBlocks(nodes: unknown, depth = 0, imageExists?: (name: string) => boolean): RichNode[] {
  if (!Array.isArray(nodes) || depth > 6) return [];
  const out: RichNode[] = [];
  for (const n of (nodes as RichNode[]).slice(0, 2000)) {
    switch (n?.type) {
      case 'paragraph':
        out.push({ type: 'paragraph', content: cleanInline(n.content) });
        break;
      case 'heading': {
        const level = n.attrs?.level === 3 ? 3 : 2;
        const content = cleanInline(n.content);
        if (content.length) out.push({ type: 'heading', attrs: { level }, content });
        break;
      }
      case 'bulletList':
      case 'orderedList': {
        const items = (Array.isArray(n.content) ? n.content : [])
          .filter((li) => li?.type === 'listItem')
          .map((li) => ({ type: 'listItem', content: cleanBlocks(li.content, depth + 1, imageExists).filter((c) => ['paragraph', 'bulletList', 'orderedList', 'photo', 'video'].includes(c.type)) }))
          .filter((li) => li.content.length);
        if (items.length) out.push({ type: n.type, content: items });
        break;
      }
      case 'blockquote': {
        const content = cleanBlocks(n.content, depth + 1, imageExists).filter((c) => ['paragraph', 'photo', 'video'].includes(c.type));
        if (content.length) out.push({ type: 'blockquote', content });
        break;
      }
      case 'photo': {
        const name = typeof n.attrs?.name === 'string' ? n.attrs.name.slice(0, 120) : '';
        if (name && (!imageExists || imageExists(name))) {
          out.push({ type: 'photo', attrs: { name, alt: String(n.attrs?.alt ?? '').slice(0, 200), caption: String(n.attrs?.caption ?? '').slice(0, 200) } });
        }
        break;
      }
      case 'video': {
        const id = String(n.attrs?.youtubeId ?? '');
        if (YT_ID.test(id)) out.push({ type: 'video', attrs: { youtubeId: id, title: String(n.attrs?.title ?? 'Video').slice(0, 160) || 'Video' } });
        break;
      }
    }
  }
  return out;
}

export function cleanDoc(doc: unknown, imageExists?: (name: string) => boolean): RichNode {
  const content = cleanBlocks((doc as RichNode)?.content, 0, imageExists);
  // Trim empty paragraphs from the start and end.
  const isEmpty = (n: RichNode) => n.type === 'paragraph' && !n.content?.length;
  while (content.length && isEmpty(content[0])) content.shift();
  while (content.length && isEmpty(content[content.length - 1])) content.pop();
  return { type: 'doc', content };
}

/* ---------- Helpers ---------- */
export function docText(node: RichNode | undefined): string {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  return (node.content ?? []).map(docText).join(' ');
}

export function docImages(node: RichNode | undefined): string[] {
  if (!node) return [];
  if (node.type === 'photo' && typeof node.attrs?.name === 'string') return [node.attrs.name];
  return (node.content ?? []).flatMap(docImages);
}

export function docHasContent(doc: RichNode) {
  return docText(doc).trim().length > 0 || docImages(doc).length > 0 || JSON.stringify(doc).includes('"video"');
}

/* ---------- Rendering ---------- */
export interface RenderHelpers {
  image: (name: string) => { src: string; srcset?: string; largest: string; ratio?: number };
  videoThumb: (youtubeId: string) => string;
}

const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor"/></svg>';
const YT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8Z"/><path d="m10 15 5-3-5-3v6Z" fill="currentColor"/></svg>';

function renderInline(nodes: RichNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === 'hardBreak') return '<br />';
      let html = esc(n.text ?? '');
      for (const m of n.marks ?? []) {
        if (m.type === 'bold') html = `<strong>${html}</strong>`;
        else if (m.type === 'italic') html = `<em>${html}</em>`;
        else if (m.type === 'underline') html = `<u>${html}</u>`;
        else if (m.type === 'link') {
          const href = safeHref(m.attrs?.href);
          if (!href) continue;
          const ext = /^https?:/i.test(href);
          html = `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${html}</a>`;
        }
      }
      return html;
    })
    .join('');
}

function renderNode(n: RichNode, h: RenderHelpers): string {
  switch (n.type) {
    case 'paragraph': {
      const inner = renderInline(n.content);
      return inner ? `<p>${inner}</p>` : '';
    }
    case 'heading': {
      const tag = n.attrs?.level === 3 ? 'h3' : 'h2';
      return `<${tag}>${renderInline(n.content)}</${tag}>`;
    }
    case 'bulletList':
    case 'orderedList': {
      const tag = n.type === 'bulletList' ? 'ul' : 'ol';
      const items = (n.content ?? []).map((li) => {
        const kids = li.content ?? [];
        const inner = kids.length === 1 && kids[0].type === 'paragraph' ? renderInline(kids[0].content) : kids.map((k) => renderNode(k, h)).join('');
        return `<li>${inner}</li>`;
      });
      return `<${tag}>${items.join('')}</${tag}>`;
    }
    case 'blockquote':
      return `<blockquote>${(n.content ?? []).map((k) => renderNode(k, h)).join('')}</blockquote>`;
    case 'photo': {
      const name = String(n.attrs?.name ?? '');
      const im = h.image(name);
      const alt = esc(String(n.attrs?.alt ?? ''));
      const caption = String(n.attrs?.caption ?? '');
      const dims = im.ratio ? ` width="1600" height="${Math.round(1600 / im.ratio)}"` : '';
      return `<figure class="prose-figure"><div class="media"><img src="${esc(im.src)}"${im.srcset ? ` srcset="${esc(im.srcset)}" sizes="(min-width: 900px) 70ch, 100vw"` : ''} alt="${alt}"${dims} loading="lazy" decoding="async" /></div>${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
    }
    case 'video': {
      const id = String(n.attrs?.youtubeId ?? '');
      if (!YT_ID.test(id)) return '';
      const title = esc(String(n.attrs?.title ?? 'Video'));
      return `<div class="lite"><img src="${esc(h.videoThumb(id))}" alt="" width="1280" height="720" loading="lazy" decoding="async" /><a class="card-link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" data-video-open="${id}" data-video-title="${title}" aria-label="Play video: ${title}"></a><span class="play" aria-hidden="true">${PLAY_SVG}</span><span class="lite__label">${YT_SVG} Watch</span></div>`;
    }
  }
  return '';
}

export function renderDoc(doc: RichNode | undefined, helpers: RenderHelpers): string {
  return (doc?.content ?? []).map((n) => renderNode(n, helpers)).join('\n');
}
