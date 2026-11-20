# Beach Volleyball TV

Website and content admin for Beach Volleyball TV, an Australian beach volleyball community born in Bondi.

Built with [Astro 5](https://astro.build) and hosted free in two places:
- **Public website** (`beachvolleyballtv.com.au`): built into static files and published by GitHub Pages (`.github/workflows/pages.yml`). Fast, never "sleeps". The domain stays registered and managed at GoDaddy.
- **Admin** (`/admin`), its API and a photo fallback: run as a [Cloudflare](https://cloudflare.com) Worker at `beach-volleyball-tv.coopercine.workers.dev`. (Typing `beachvolleyballtv.com.au/admin` redirects there.)
- Saving in the admin commits to this GitHub repository, which republishes the site. **Changes go live about a minute after saving.**
- The site ships almost no JavaScript, apart from the hero's volleyball and the admin itself.

> Updating the website? See **[ADMIN-GUIDE.md](ADMIN-GUIDE.md)**. It's written for non-technical editors.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321  (admin: http://localhost:4321/admin/)
npm run build     # production build in ./dist
npm run preview   # run the built site in Cloudflare's local runtime (wrangler)
npm run deploy    # build and deploy straight from your computer (needs `npx wrangler login`)
npm run check     # type-check
```

Needs Node 22+. Locally, `npm run dev` reads and writes the files in `content/` directly (admin login: set `ADMIN_PASSWORD` in `.env`, there is no default password).

## Admin

`/admin/` is a WordPress-style admin with these features:
- **Login:** a signed, httpOnly, SameSite=Strict session cookie (7 days), with login attempts rate-limited.
- **Events:** list, search, filter (upcoming / past / drafts), bulk delete (including "select all past events"), and create/edit/delete.
- **News:** the same list tools, plus a Word-style editor built on [Tiptap](https://tiptap.dev) (MIT). It handles headings, bold/italic/underline, lists, quotes, links, inline photos and YouTube videos, and pastes cleanly from Word and Google Docs. Stories are stored as JSON, cleaned against a whitelist on the server (`src/lib/rich.ts`) and rendered to HTML there; raw HTML is never stored.
- **Videos:** paste a YouTube link to add a video (the title is fetched automatically). Reorder, recategorise, choose the featured video, remove.
- **Photos:** cropped in the browser to the site's 16:10 format, with a "safe area" guide. They're exported at 1600 px and 800 px, compressed to WebP (JPEG on Safari) and uploaded. Uploads that nothing uses any more are cleaned up automatically.
- **Drafts:** hidden from the public, but previewable by a logged-in admin.

### Settings

Set these on Cloudflare (Worker → **Settings → Variables and Secrets**). `GITHUB_REPO`, `GITHUB_BRANCH` and `ADMIN_USER` already have values in `wrangler.jsonc`. For local `npm run preview`, put secrets in a `.dev.vars` file (git-ignored).

| Name | Type | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | **Secret** | Fine-grained token: access to **this repo only**, permission **Contents: Read and write**. Server-only |
| `ADMIN_PASSWORD` | **Secret** | Admin password. **Required:** logins are refused until it exists (there is no built-in password) |
| `SESSION_SECRET` | Secret, optional | Signs login cookies. If unset, a key derived from `ADMIN_PASSWORD` is used (changing the password logs everyone out) |
| `GITHUB_REPO` | Variable | `owner/repo`, set in `wrangler.jsonc` |
| `GITHUB_BRANCH` | Variable | Branch to save to (default `main`) |
| `ADMIN_USER` | Variable | Admin username (default `admin`) |

## Where content lives

All content lives in the repo's `content/` folder:

```
content/
  events.json     events
  news.json       news stories
  videos.json     YouTube library
  images.json     registry of uploaded photos
  uploads/        uploaded photos
```

- **Build time:** the build reads `content/*.json` and writes every public page as a static file. `scripts/copy-uploads.mjs` (the `prebuild` step) copies `content/uploads/` into the site as `/uploads/…`.
- **Admin (Cloudflare Worker):** every admin request reads the latest files from GitHub, and every save is **one commit** (e.g. "Website admin: update events") made through GitHub's Git Data API. That commit makes Cloudflare rebuild the site. The full edit history is in Git, so any change can be undone.
- **Photos** you upload show up in the admin instantly (served from GitHub by `/uploads/[file]`), and become ordinary static files once the rebuild finishes.
- **Locally** (`npm run dev`), the admin reads and writes `content/` on disk. Commit and push those changes yourself.
- **Daily refresh:** "upcoming events" is worked out at build time, so `.github/workflows/pages.yml` also runs every night just after midnight Sydney time to republish the site and drop finished events.

Built-in stock photos live in `public/images/` and are listed in `src/data/images.ts`.

## Deploying (free: GitHub Pages + Cloudflare)

The repository must be **public** (GitHub Pages is free only for public repos). It holds no secrets: the GitHub token and admin password live only in Cloudflare.

### Public website: GitHub Pages
1. Repo → Settings → Pages → Source: **GitHub Actions**. Custom domain: `beachvolleyballtv.com.au`, then tick **Enforce HTTPS** once the certificate is ready.
2. At the domain registrar (GoDaddy), the web records are:
   - four **A** records on `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - one **CNAME** on `www`: `rodgutierrezbasualto.github.io`
   - (optional) four **AAAA** records on `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   Leave all email records (MX, SPF, DKIM and so on) alone.
3. The **Publish website** workflow runs on every push to `main`, every night just after midnight Sydney time (so finished events drop off the lists), and on demand (Actions → Publish website → Run workflow).

### Admin: Cloudflare Worker
1. **Token:** GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**. Access to **only this repository**, **Contents: Read and write**. Choose a long expiry and note the date, because the admin can't save after it expires.
2. **Cloudflare:** Workers & Pages → Create → Import a repository, pick the repo. Build command `npm run build`, deploy command `npx wrangler deploy`. The Worker is named `beach-volleyball-tv` (see `wrangler.jsonc`).
3. **Secrets:** Worker → Settings → Variables and Secrets → add `GITHUB_TOKEN` and `ADMIN_PASSWORD` as **Secrets**. (Or `npx wrangler secret put GITHUB_TOKEN`.)
4. Quick manual deploy from your computer: `npm run deploy` (after `npx wrangler login`).

After that:
- Code pushes to `main` redeploy both the public site and the admin.
- Admin saves commit to `content/` (one commit per save), which republishes the public site.
- **Working on the code after launch:** the live admin commits to the repo, so always `git pull` before changing code locally, and before pushing.

**Free-plan notes:**
- Public pages are served by GitHub Pages: no request limits for a site this size (GitHub's soft limits are 100 GB/month bandwidth, 1 GB site size). Only admin and photo-fallback requests count against Cloudflare Workers Free (100,000 requests/day, 10 ms CPU each).
- Each photo adds about 100–300 KB to the repo, which is fine for years of use.
- Login attempts are rate-limited only per server instance. Use a long password (and optionally a Cloudflare rate-limiting rule on `/api/admin/login`).

## Code structure

```
src/
  admin.config.ts   admin login settings
  middleware.ts     admin auth guard + cross-site request protection
  pages/            public pages (static), /admin pages and /api/admin endpoints (server), /uploads photo fallback, sitemap
  layouts/          BaseLayout (public), AdminLayout (admin)
  components/       public components (+ EventDetail / ArticleDetail, shared by the live and preview pages; admin/ImagePicker)
  lib/
    content.ts      content store (in memory, saved via storage.ts), slugs, image cleanup
    storage.ts      storage: GitHub repository (on Cloudflare, one commit per save) or local files
    env.ts          reads settings from the environment / .env
    validate.ts     cleans and validates admin input
    rich.ts         story format: clean (whitelist), render to HTML, convert old stories
    auth.ts         sessions, password check, rate limiting
    utils.ts        dates, images, links
  scripts/
    main.ts         public site: header, menu, reveals, filters, video pop-up, contact form
    hero-ball.ts    the interactive flat volleyball in the home hero
    admin.ts        admin: lists, editors, photo pickers, video manager
    admin-shared.ts admin helpers: dialogs, API calls, photo cropper/compressor/upload
    rich-editor.ts  Word-style story editor (Tiptap), loaded only on the story editor page
  data/             site settings (site.ts), content types, built-in image list
content/            site content (saved by the admin)
wrangler.jsonc      Cloudflare Worker settings
scripts/            build helper (copies uploads into the site)
.github/workflows/  publishes the public site to GitHub Pages (on every push and nightly)
```

### Other settings

- **Contact buttons:** `contactEnabled` in `src/data/site.ts`. While it's `false`, "Contact us", "Enquire", mailing-list and contact-form buttons are shown but do nothing. Set it to `true` to switch them on.
- **Social links, groups and emails** (YouTube, Instagram, TikTok, Instagram group, WhatsApp group/community, partnerships email): `src/data/site.ts`.
- **Instagram stats** (About and Partners pages): `src/data/instagram-stats.ts`.
- **Contact form:** set `formEndpoint` in `src/data/site.ts` to a Formspree, Web3Forms or Basin URL to receive submissions. While it's empty, the form opens the visitor's email app pre-filled to the site's email address.
- **Hero ball:** its colours are the constants at the top of `src/scripts/hero-ball.ts`. The seam shapes come from the MIT-licensed Tabler icon set.

## Before launch

- Set your own `ADMIN_PASSWORD` secret on Cloudflare (required once deployed).
- Review the starter event details and article copy, especially anything about real people.
- Replace the stock Unsplash photos (free under the Unsplash License) with your own Bondi photography, using the admin.
