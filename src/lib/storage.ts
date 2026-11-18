/**
 * Where content and uploaded photos are stored.
 *
 * - GitHub (production on Render's free plan): set GITHUB_TOKEN and
 *   GITHUB_REPO. Every save in the admin is committed to the repository's
 *   content/ folder, and on start-up the site loads the latest content from
 *   GitHub — so nothing is lost when the free server restarts or sleeps.
 *   Photos are committed too and served through the site (works with a
 *   private repo).
 * - Local files (default): content/*.json and content/uploads/ on disk.
 *
 * The token is only ever used here, on the server.
 */
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

export const DATA_DIR = path.resolve(env('DATA_DIR') ?? 'content');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
/** Starter content shipped with the code. */
export const BUNDLED_DIR = path.resolve('content');

export interface Backend {
  kind: 'local' | 'github';
  /** Returns undefined when the collection doesn't exist yet. */
  read(file: string): Promise<unknown | undefined>;
  write(file: string, data: unknown): Promise<void>;
  putUpload(filename: string, body: Buffer): Promise<void>;
  getUpload(filename: string): Promise<Buffer | null>;
  deleteUploads(filenames: string[]): Promise<void>;
  /** Local only: last-modified time, so hand edits to the files are picked up. */
  mtime?(file: string): number;
}

/* ---------- Local files ---------- */
function localBackend(): Backend {
  // First run with DATA_DIR on a fresh disk: copy in the starter content.
  if (DATA_DIR !== BUNDLED_DIR && !fs.existsSync(path.join(DATA_DIR, 'events.json')) && fs.existsSync(path.join(BUNDLED_DIR, 'events.json'))) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.cpSync(BUNDLED_DIR, DATA_DIR, { recursive: true });
  }
  return {
    kind: 'local',
    async read(file) {
      try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
        throw err;
      }
    },
    async write(file, data) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const p = path.join(DATA_DIR, file);
      const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
      fs.renameSync(tmp, p); // atomic replace
    },
    async putUpload(filename, body) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), body);
    },
    async getUpload(filename) {
      const p = path.join(UPLOAD_DIR, path.basename(filename));
      return fs.existsSync(p) ? fs.readFileSync(p) : null;
    },
    async deleteUploads(filenames) {
      for (const f of filenames) fs.rmSync(path.join(UPLOAD_DIR, path.basename(f)), { force: true });
    },
    mtime(file) {
      try { return fs.statSync(path.join(DATA_DIR, file)).mtimeMs; } catch { return 0; }
    },
  };
}

/* ---------- GitHub repository (via the GitHub REST API) ---------- */
function githubBackend(token: string, repo: string, branch: string, api: string): Backend {
  const shas = new Map<string, string>(); // repo path -> blob sha (needed to update/delete)
  const repoPath = (file: string) => `content/${file}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'website-admin',
  };

  async function gh(method: string, p: string, body?: unknown, accept?: string) {
    const url = `${api}/repos/${repo}/contents/${p.split('/').map(encodeURIComponent).join('/')}${method === 'GET' ? `?ref=${encodeURIComponent(branch)}` : ''}`;
    return fetch(url, {
      method,
      headers: { ...headers, ...(accept ? { Accept: accept } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
  }

  async function fail(res: Response, what: string): Promise<never> {
    const detail = await res.text().catch(() => '');
    const hint = res.status === 401 ? ' (check GITHUB_TOKEN)' : res.status === 404 ? ' (check GITHUB_REPO and that the token can access it)' : res.status === 403 ? ' (the token needs “Contents: Read and write”)' : '';
    throw new Error(`GitHub: couldn't ${what} — ${res.status}${hint} ${detail.slice(0, 200)}`);
  }

  async function currentSha(p: string) {
    const res = await gh('GET', p);
    if (res.status === 404) return undefined;
    if (!res.ok) await fail(res, `look up ${p}`);
    const meta = (await res.json()) as { sha: string };
    shas.set(p, meta.sha);
    return meta.sha;
  }

  async function put(p: string, content: Buffer, message: string) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const sha = shas.get(p) ?? (attempt === 0 ? undefined : await currentSha(p));
      const res = await gh('PUT', p, { message, content: content.toString('base64'), branch, ...(sha ? { sha } : {}) });
      if (res.ok) {
        const out = (await res.json()) as { content?: { sha?: string } };
        if (out.content?.sha) shas.set(p, out.content.sha);
        return;
      }
      // 409/422: our copy of the file version is out of date — refresh and retry once.
      if ((res.status === 409 || res.status === 422) && attempt === 0) {
        shas.delete(p);
        await currentSha(p);
        continue;
      }
      await fail(res, `save ${p}`);
    }
  }

  return {
    kind: 'github',
    async read(file) {
      const p = repoPath(file);
      const res = await gh('GET', p);
      if (res.status === 404) return undefined;
      if (!res.ok) await fail(res, `read ${p}`);
      const meta = (await res.json()) as { sha: string; content?: string; encoding?: string };
      shas.set(p, meta.sha);
      let text: string;
      if (meta.content && meta.encoding === 'base64') text = Buffer.from(meta.content, 'base64').toString('utf8');
      else {
        // Files over 1 MB come back without content; fetch the raw file instead.
        const raw = await gh('GET', p, undefined, 'application/vnd.github.raw+json');
        if (!raw.ok) await fail(raw, `read ${p}`);
        text = await raw.text();
      }
      return JSON.parse(text);
    },
    async write(file, data) {
      await put(repoPath(file), Buffer.from(JSON.stringify(data, null, 2) + '\n'), `Website admin: update ${file.replace('.json', '')}`);
    },
    async putUpload(filename, body) {
      await put(repoPath(`uploads/${filename}`), body, `Website admin: add photo ${filename}`);
    },
    async getUpload(filename) {
      const res = await gh('GET', repoPath(`uploads/${filename}`), undefined, 'application/vnd.github.raw+json');
      if (res.status === 404) return null;
      if (!res.ok) await fail(res, `load photo ${filename}`);
      return Buffer.from(await res.arrayBuffer());
    },
    async deleteUploads(filenames) {
      for (const f of filenames) {
        const p = repoPath(`uploads/${f}`);
        try {
          const sha = shas.get(p) ?? (await currentSha(p));
          if (!sha) continue;
          const res = await gh('DELETE', p, { message: `Website admin: remove unused photo ${f}`, sha, branch });
          if (!res.ok && res.status !== 404) console.warn(`GitHub: couldn't delete ${p} (${res.status})`);
          shas.delete(p);
        } catch (err) {
          console.warn((err as Error).message);
        }
      }
    },
  };
}

const GITHUB_TOKEN = env('GITHUB_TOKEN');
const GITHUB_REPO = env('GITHUB_REPO')?.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');

export const backend: Backend =
  GITHUB_TOKEN && GITHUB_REPO
    ? githubBackend(GITHUB_TOKEN, GITHUB_REPO, env('GITHUB_BRANCH') ?? 'main', (env('GITHUB_API_URL') ?? 'https://api.github.com').replace(/\/+$/, ''))
    : localBackend();
