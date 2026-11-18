# Beach Volleyball TV

Website and content admin for Beach Volleyball TV, an Australian beach volleyball community born in Bondi.

Built with [Astro 5](https://astro.build) running as a small Node.js server.
- The public site reads content on every request, so anything saved in the admin is live immediately, with no rebuild.
- The site ships almost no JavaScript, apart from the hero's volleyball and the admin itself.

> Updating the website? See **[ADMIN-GUIDE.md](ADMIN-GUIDE.md)**. It's written for non-technical editors.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321  (admin: http://localhost:4321/admin/)
npm run build     # production build in ./dist
npm start         # run the production server (reads .env if present)
npm run check     # type-check
```

Needs Node 22+.

## Admin

`/admin/` is a WordPress-style admin with these features:
- **Login:** a signed, httpOnly, SameSite=Strict session cookie (7 days), with login attempts rate-limited.
- **Events:** list, search, filter (upcoming / past / drafts), bulk delete (including "select all past events"), and create/edit/delete.
- **News:** the same list tools, plus a Word-style editor built on [Tiptap](https://tiptap.dev) (MIT). It handles headings, bold/italic/underline, lists, quotes, links, inline photos and YouTube videos, and pastes cleanly from Word and Google Docs. Stories are stored as JSON, cleaned against a whitelist on the server (`src/lib/rich.ts`) and rendered to HTML there; raw HTML is never stored.
- **Videos:** paste a YouTube link to add a video (the title is fetched automatically). Reorder, recategorise, choose the featured video, remove.
- **Photos:** cropped in the browser to the site's 16:10 format, with a "safe area" guide. They're exported at 1600 px and 800 px, compressed to WebP (JPEG on Safari) and uploaded. Uploads that nothing uses any more are cleaned up automatically.
- **Drafts:** hidden from the public, but previewable by a logged-in admin.

### Settings (environment variables)

Set these on your host (Render: the service's **Environment** tab). For local testing, copy `.env.example` to `.env`.

| Variable | Purpose |
| --- | --- |
| `GITHUB_REPO` | The site's repository, e.g. `your-name/beach-volleyball-tv`. With `GITHUB_TOKEN`, it switches on GitHub storage |
| `GITHUB_TOKEN` | Fine-grained token: access to **this repo only**, permission **Contents: Read and write**. Server-only |
| `GITHUB_BRANCH` | Branch to save to (default `main`) |
| `ADMIN_USER` | Admin username (default `admin`) |
| `ADMIN_PASSWORD` | Admin password. **Required once deployed:** with `GITHUB_TOKEN` set, logins are refused until this exists, because the default in `src/admin.config.ts` is in Git |
| `SESSION_SECRET` | Long random string that signs login cookies, so logins survive restarts (Render generates one automatically) |
| `DATA_DIR` | Local-files mode only: where content is stored (default `./content`) |
| `PORT`, `HOST` | Server port and interface (Render sets `PORT`; use `HOST=0.0.0.0`) |

## Where content lives

All content lives in the repo's `content/` folder:

```
content/
  events.json     events
  news.json       news stories
  videos.json     YouTube library
  images.json     registry of uploaded photos
  uploads/        uploaded photos (served by the site at /uploads/…)
```

`src/lib/storage.ts` picks one of two modes automatically:

- **GitHub** (when `GITHUB_TOKEN` and `GITHUB_REPO` are set). Every save in the admin is committed to `content/` in the repo, e.g. "Website admin: update events". On start-up the site loads the latest content from GitHub, so nothing is lost when the free server sleeps or restarts. Photos are committed too and served through the site, so the repo can stay private. The full edit history is in Git, so any change can be undone.
- **Local files** (otherwise, e.g. `npm run dev`). The site reads and writes `content/` on disk.

The deployed server keeps content in memory and is the only writer. If you edit `content/` directly on GitHub, restart the Render service afterwards to load it. Any admin save made before that restart overwrites the direct edit.
Built-in stock photos live in `public/images/` and are listed in `src/data/images.ts`.

## Deploying for free (GitHub + Render)

1. **GitHub:** push this project to a repository (private is fine). `.env` is git-ignored, so no secrets are committed.
2. **Token:** on GitHub, go to Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate. Give it access to **only this repository**, with **Contents: Read and write**. Choose a long expiry and note the date, because the admin can't save after the token expires.
3. **Render:** choose New → **Blueprint**, then pick the repo. `render.yaml` sets up a free web service. Fill in `GITHUB_REPO`, `GITHUB_TOKEN`, `ADMIN_USER` and `ADMIN_PASSWORD` when asked.
   - Code pushes redeploy automatically.
   - Admin edits (commits to `content/`) **don't** trigger a rebuild, because they're excluded by `buildFilter`.
4. **Domain:** in Render, add `beachvolleyballtv.com.au` under Settings → Custom Domains and follow its DNS instructions. HTTPS is automatic.

**Working on the code after launch:** the live admin commits to the repo, so always run `git pull` before changing code locally, and before pushing.

**Free-tier trade-offs:**
- Render puts the site to sleep after 15 minutes without visitors, so the next visit takes about a minute to load (it reloads content from GitHub).
- Render's free plan includes 750 hours a month, enough for one site running all the time.
- Each photo adds about 100–300 KB to the repo, which is fine for years of use.

## Code structure

```
src/
  admin.config.ts   admin login defaults
  middleware.ts     admin auth guard + cross-site request protection
  pages/            public pages, /admin pages, /api/admin endpoints, /uploads route, sitemap
  layouts/          BaseLayout (public), AdminLayout (admin)
  components/       public components (+ admin/ImagePicker)
  lib/
    content.ts      content store (in memory, saved via storage.ts), slugs, image cleanup
    storage.ts      storage backends: GitHub repository or local files
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
render.yaml         Render Blueprint (free web service)
```

### Other settings

- **Contact buttons:** `contactEnabled` in `src/data/site.ts`. While it's `false`, "Contact us", "Enquire", mailing-list and contact-form buttons are shown but do nothing. Set it to `true` to switch them on.
- **Social links, groups and emails** (YouTube, Instagram, TikTok, Instagram group, WhatsApp group/community, partnerships email): `src/data/site.ts`.
- **Instagram stats** (About and Partners pages): `src/data/instagram-stats.ts`.
- **Contact form:** set `formEndpoint` in `src/data/site.ts` to a Formspree, Web3Forms or Basin URL to receive submissions. While it's empty, the form opens the visitor's email app pre-filled to the site's email address.
- **Hero ball:** its colours are the constants at the top of `src/scripts/hero-ball.ts`. The seam shapes come from the MIT-licensed Tabler icon set.

## Before launch

- Set your own `ADMIN_PASSWORD` on the host (required once deployed).
- Review the starter event details and article copy, especially anything about real people.
- Replace the stock Unsplash photos (free under the Unsplash License) with your own Bondi photography, using the admin.
