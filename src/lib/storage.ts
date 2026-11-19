/**
 * Where content and uploaded photos are stored.
 *
 * - On Cloudflare (production): the admin saves to the GitHub repository's
 *   content/ folder. Every admin save is ONE commit (made through GitHub's Git
 *   Data API), which makes Cloudflare rebuild the site. Needs GITHUB_TOKEN and
 *   GITHUB_REPO. The token is only ever used here, on the server.
 * - Everywhere else (npm run dev, and the build itself): plain files in
 *   content/ and content/uploads/ on disk.
 *
 * Changes are staged with write / putUpload / deleteUploads and saved
 * together by commit().
 */
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

export interface Backend {
  kind: 'local' | 'github';
  /** Returns undefined when the collection doesn't exist yet. */
  read(file: string): Promise<unknown | undefined>;
  write(file: string, data: unknown): Promise<void>;
  putUpload(filename: string, body: Buffer): Promise<void>;
  getUpload(filename: string): Promise<Buffer | null>;
  deleteUploads(filenames: string[]): Promise<void>;
  /** Saves everything staged since the last commit as a single change. */
  commit(message: string): Promise<void>;
  /** Forgets staged changes (after a failure). */
  discard(): void;
  /** Local only: last-modified time, so hand edits to the files are picked up. */
  mtime?(file: string): number;
}

/** True when running inside Cloudflare's Worker runtime. */
export const isWorkers = () => typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

/* ---------- Local files ---------- */
function localBackend(): Backend {
  const dataDir = path.resolve(env('DATA_DIR') ?? 'content');
  const uploadDir = path.join(dataDir, 'uploads');
  return {
    kind: 'local',
    async read(file) {
      try {
        return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
        throw err;
      }
    },
    async write(file, data) {
      fs.mkdirSync(dataDir, { recursive: true });
      const p = path.join(dataDir, file);
      const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
      fs.renameSync(tmp, p); // atomic replace
    },
    async putUpload(filename, body) {
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, path.basename(filename)), body);
    },
    async getUpload(filename) {
      const p = path.join(uploadDir, path.basename(filename));
      return fs.existsSync(p) ? fs.readFileSync(p) : null;
    },
    async deleteUploads(filenames) {
      for (const f of filenames) fs.rmSync(path.join(uploadDir, path.basename(f)), { force: true });
    },
    async commit() {},
    discard() {},
    mtime(file) {
      try { return fs.statSync(path.join(dataDir, file)).mtimeMs; } catch { return 0; }
    },
  };
}

/* ---------- GitHub repository (via the GitHub REST API) ---------- */
type Change = { text?: string; bytes?: Buffer; remove?: boolean };

function githubBackend(token: string, repo: string, branch: string, apiBase: string): Backend {
  const pending = new Map<string, Change>(); // repo path -> staged change
  const repoPath = (file: string) => `content/${file}`;

  async function gh(method: string, url: string, body?: unknown, accept = 'application/vnd.github+json') {
    return fetch(`${apiBase}/repos/${repo}${url}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: accept,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'website-admin',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
  }

  async function fail(res: Response, what: string): Promise<never> {
    const detail = await res.text().catch(() => '');
    const hint = res.status === 401 ? ' (check GITHUB_TOKEN)' : res.status === 404 ? ' (check GITHUB_REPO and that the token can access it)' : res.status === 403 ? ' (the token needs “Contents: Read and write”)' : '';
    throw new Error(`GitHub: couldn't ${what} — ${res.status}${hint} ${detail.slice(0, 200)}`);
  }

  async function json<T>(res: Response, what: string): Promise<T> {
    if (!res.ok) await fail(res, what);
    return (await res.json()) as T;
  }

  const contentsUrl = (p: string) => `/contents/${p.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}&_=${Date.now()}`;

  return {
    kind: 'github',
    async read(file) {
      const res = await gh('GET', contentsUrl(repoPath(file)), undefined, 'application/vnd.github.raw+json');
      if (res.status === 404) return undefined;
      if (!res.ok) await fail(res, `read ${repoPath(file)}`);
      return JSON.parse(await res.text());
    },
    async write(file, data) {
      pending.set(repoPath(file), { text: JSON.stringify(data, null, 2) + '\n' });
    },
    async putUpload(filename, body) {
      pending.set(repoPath(`uploads/${filename}`), { bytes: body });
    },
    async getUpload(filename) {
      const res = await gh('GET', contentsUrl(repoPath(`uploads/${filename}`)), undefined, 'application/vnd.github.raw+json');
      if (res.status === 404) return null;
      if (!res.ok) await fail(res, `load photo ${filename}`);
      return Buffer.from(await res.arrayBuffer());
    },
    async deleteUploads(filenames) {
      for (const f of filenames) pending.set(repoPath(`uploads/${f}`), { remove: true });
    },
    discard() {
      pending.clear();
    },
    async commit(message) {
      if (!pending.size) return;
      const changes = [...pending];
      const blobs = new Map<string, string>(); // uploaded blob shas, kept across retries
      for (let attempt = 0; attempt < 3; attempt++) {
        const ref = await json<{ object: { sha: string } }>(await gh('GET', `/git/ref/heads/${encodeURIComponent(branch)}`), `find branch ${branch}`);
        const headSha = ref.object.sha;
        const head = await json<{ tree: { sha: string } }>(await gh('GET', `/git/commits/${headSha}`), 'read the latest commit');

        // Only delete files that exist (GitHub rejects deleting a missing path).
        let existing: Set<string> | undefined;
        if (changes.some(([, c]) => c.remove)) {
          const tree = await json<{ tree: { path: string }[] }>(await gh('GET', `/git/trees/${head.tree.sha}?recursive=1`), 'list the repository files');
          existing = new Set(tree.tree.map((t) => t.path));
        }

        const entries: Record<string, unknown>[] = [];
        for (const [p, c] of changes) {
          if (c.remove) {
            if (existing?.has(p)) entries.push({ path: p, mode: '100644', type: 'blob', sha: null });
          } else if (c.bytes) {
            let sha = blobs.get(p);
            if (!sha) {
              const blob = await json<{ sha: string }>(await gh('POST', '/git/blobs', { content: c.bytes.toString('base64'), encoding: 'base64' }), `upload ${p}`);
              sha = blob.sha;
              blobs.set(p, sha);
            }
            entries.push({ path: p, mode: '100644', type: 'blob', sha });
          } else {
            entries.push({ path: p, mode: '100644', type: 'blob', content: c.text });
          }
        }
        if (!entries.length) break;

        const tree = await json<{ sha: string }>(await gh('POST', '/git/trees', { base_tree: head.tree.sha, tree: entries }), 'prepare the change');
        const commit = await json<{ sha: string }>(await gh('POST', '/git/commits', { message, tree: tree.sha, parents: [headSha] }), 'create the commit');
        const move = await gh('PATCH', `/git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha, force: false });
        if (move.ok) break;
        // 422: someone else committed in the meantime — try again on top of their change.
        if (move.status === 422 && attempt < 2) continue;
        await fail(move, `save to ${branch}`);
      }
      pending.clear();
    },
  };
}

/** Throws a clear message when the site is deployed without storage settings. */
function brokenBackend(): Backend {
  const stop = (): never => {
    throw new Error('Saving isn’t set up yet: add GITHUB_TOKEN (and GITHUB_REPO) in the Cloudflare settings.');
  };
  return { kind: 'github', read: stop, write: stop, putUpload: stop, getUpload: stop, deleteUploads: stop, commit: async () => {}, discard() {} };
}

let cached: Backend | undefined;
/** Chosen on first use (not at import time), because Cloudflare only provides settings while handling a request. */
export function getBackend(): Backend {
  if (cached) return cached;
  const token = env('GITHUB_TOKEN');
  const repo = env('GITHUB_REPO')?.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  if (isWorkers()) {
    if (!token || !repo) return brokenBackend(); // not cached, so fixing the settings works without a restart
    cached = githubBackend(token, repo, env('GITHUB_BRANCH') ?? 'main', (env('GITHUB_API_URL') ?? 'https://api.github.com').replace(/\/+$/, ''));
  } else {
    cached = localBackend();
  }
  return cached;
}
