// Copies photos uploaded through the admin (content/uploads) into public/uploads,
// so they're published as ordinary static files with the site.
import fs from 'node:fs';

fs.rmSync('public/uploads', { recursive: true, force: true });
if (fs.existsSync('content/uploads')) fs.cpSync('content/uploads', 'public/uploads', { recursive: true });
