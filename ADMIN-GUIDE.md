# Updating the Beach Volleyball TV website

A step-by-step guide for whoever looks after the website. No technical knowledge needed.

- **Part 1** is the guide for editors.
- **Part 2** is a script and screen map for making a video tutorial (for Claude Code, or anyone producing the video).

---

# Part 1: Editor's guide

## The big picture

The admin has four sections, in the menu on the left:

| Section | What it controls | Where it shows on the website |
| --- | --- | --- |
| **Dashboard** | An overview and quick buttons | Nowhere. It's only for you |
| **Events** | Tournaments, clinics, weekly games and community days | **Events** page, **Community** page, and the Home page |
| **News** | Written stories (with photos and videos inside) | **News & Media** page and the Home page |
| **Videos** | The YouTube library | **Videos** page, **News & Media** page, **Athletes** page and the Home page |

**Saving takes about a minute to appear.** When you press Save, the website rebuilds itself. A brand-new page may say "not found" for a minute. Wait and refresh.

## Logging in

1. Go to your website address followed by **/admin** (for example `beachvolleyballtv.com.au/admin`). It sends you to the admin page, which lives at `beach-volleyball-tv.coopercine.workers.dev/admin/`. Bookmark that address.
2. Type your **username** and **password**, then press **Log in**. Ask the site owner if you don't have them.
3. You land on the **Dashboard**. You stay logged in for 7 days.

If you get the password wrong 8 times, you're locked out for 10 minutes.

## The Dashboard

- **At a glance:** counts of upcoming events, past events, published stories and videos. Click any box to jump to that list.
- **Quick actions:** **Add a new event**, **Write a news story**, **Add a YouTube video**.
- **Coming up** and **Latest stories:** shortcuts to open what's already there.
- A yellow box appears when some events have already happened, with a link to tidy them up.
- **View website** (bottom left) opens the public site in a new tab. **Log out** is underneath it.

## Events

### Add an event

1. Click **Events** in the left menu, then **+ Add new event**.
2. Type the **Event name** in the big box at the top.
3. **About the event**
   - **Short summary:** one or two sentences, shown on the event cards.
   - **Full description:** the details. Leave an empty line between paragraphs.
4. **When**
   - **Date** and **Starts** (and **Finishes** if you know it).
   - **Last day:** only for events that run over several days or weeks.
   - **Time note:** replaces the times, e.g. "10am till late" or "Check Instagram to see if it's on".
   - **Repeats:** for weekly games, e.g. "Every Tuesday". This puts it in the **Weekly events** area of the Events page and on the Community page.
5. **Where:** the **Venue** and **Suburb**.
6. **Details:** **Price**, **Who it's for**, **Format** (optional) and **What's included** (one item per line).
7. **Sign-up button**
   - **Button text**, for example "Join the WhatsApp group".
   - **When clicked:** open a web link (paste a WhatsApp or Instagram group link in **Web link**), or open the contact form for a registration or a general question.
8. On the right side:
   - **Event type:** Tournament, Competition, Clinic or Community.
   - **Event photo:** see "Photos" below.
   - **Publish:** choose **Published** or **Draft**. Tick **Feature this event** to show it large at the top of the Events page (and in the spotlight on the Home page).
9. Click **Publish** (or **Save changes** when editing).

A green message confirms it saved. The event shows on the website about a minute later.

### Weekly or multi-week events

- A weekly game with no end date: fill in **Repeats** (e.g. "Every Wednesday"). It stays on the website until you delete it.
- A weekly program that finishes (e.g. 6 weeks): fill in **Repeats** and **Last day**. It disappears after that day.

### Find, edit and delete events

Open **Events** in the menu.
- The tabs **All / Upcoming / Past / Drafts** filter the list. The **Search** box finds events by name, venue or type.
- Hover over a row for **Edit**, **View** (or **Preview** for drafts) and **Delete**.
- To delete several: tick their boxes, then **Delete selected**. **Select all past events** ticks every finished event at once.
- You're always asked to confirm. **Deleting can't be undone.**

Finished events disappear from the website's "upcoming" lists by themselves soon after midnight (Sydney time) the day after they end, so deleting them is only tidying up.

## News stories

### Write a story

1. Click **News**, then **+ Write new story**.
2. Type the **Headline**, then a short **Summary** (shown on story cards and in Google).
3. Write the story in the big white page, like a Word document. Use the toolbar above it:
   - **Normal text / Heading / Subheading:** pick a style for the line your cursor is on.
   - **B**, *I* and U: bold, italic and underline. Select the words first.
   - **Bullet list**, **numbered list** and **quote** buttons.
   - **Link:** select some words, press **Link** and paste the web address. To change or remove a link, click inside it and press **Link** again.
   - **Photo:** adds a photo where your cursor is. You can also drag a photo into the text or paste one.
   - **Video:** paste a YouTube link. The title fills in by itself.
   - **Undo / Redo:** the arrows on the right.
4. Already wrote it in Word or Google Docs? Copy and paste it in. Headings, bold, lists and links come across, and messy formatting is cleaned up. Add photos afterwards with the **Photo** button.
5. On the right side:
   - **Category:** Tournament Highlights, Interviews, Athlete Profiles, Community or Features. Visitors can filter by these.
   - **Main photo:** the picture shown on cards and at the top of the story.
   - **Publish date** and **Author**.
   - **Feature this story** shows it large at the top of the News page.
6. Click **Publish**.

To change a photo inside a story, use the buttons under it: **Caption & description**, **Replace photo** or **Remove**.

## Videos

1. Click **Videos**.
2. Paste a YouTube link into **Paste the YouTube link** and click **Find video**.
3. Check the **Title**, pick a **Category** (Interviews, Tournaments, Highlights or Podcasts), optionally add a short description, then click **Add to library**.
4. In the **Library** list you can:
   - edit the title and description,
   - move a video up or down with the **↑ ↓** arrows (new videos appear at the top),
   - tick **Featured** on the one to show first,
   - remove one with **✕** (this does not delete it from YouTube).
5. **Click Save changes** (bottom bar). Nothing in this list is saved until you do.

To show a video on the **Athletes** page as a profile, type the athlete's name in its **Athlete name** box and save.

## Photos

Use any photo, from your phone or camera, at any size.

1. Click **Choose photo**, or drag a photo onto the box.
2. A cropping window opens. **Drag** to move the photo and use the **Zoom** slider (or your mouse wheel) to zoom in.
3. Keep the important part, such as faces and the ball, **inside the dotted line**. That area shows everywhere on the site.
4. Click **Use this photo**. It's resized and compressed for you, and you'll see how much smaller it got (e.g. 4.2 MB → 190 KB).
5. Fill in **Describe the photo** in a few words. This helps people who use screen readers, and helps Google.

iPhone photos in HEIC format can't be opened on some computers. If you see an error, export or share the photo as a JPG first.

## Drafts and previews

Not ready to publish? Under **Publish**, choose **Draft** and save.
- Only you can see a draft, and only while you're logged in. Use **Preview draft** to see how it will look.
- When it's ready, switch it to **Published** and save.

## Delete old events and stories

- **One item:** hover over it in the list and click **Delete**, or open it and click **Delete** in the Publish box.
- **Many:** tick the boxes, then **Delete selected**.
- You'll always be asked to confirm. Deleting can't be undone.

## Handy tips

- **Ctrl + S** (or **Cmd + S** on a Mac) saves the page you're editing.
- If you try to leave a page with unsaved changes, you'll get a warning.
- If something can't be saved, a red box at the top explains what's missing.
- Click **View website** in the left menu at any time to see the live site.
- Changes take about a minute to appear. If you don't see them, wait and refresh.
- When you're finished, click **Log out**.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| "That username or password isn't right" | Check caps lock, or ask the site owner for the password |
| "Too many attempts" | Wait 10 minutes |
| Red box: "The photo couldn't be saved" or a GitHub message | Try again in a minute. If it keeps happening, tell the site owner (the saving connection may need renewing) |
| New page says "not found" | Wait a minute and refresh |
| Change not showing | Wait a minute, then hard-refresh (Cmd/Ctrl + Shift + R) |

---

# Part 2: Video tutorial script and screen map (for Claude Code)

This part is for a separate Claude Code session that will record and edit a narrated tutorial video of the admin. Everything it needs is below: the structure, narration with timing, where each thing is on screen, and the technical notes.

## Brief

- **Audience:** a non-technical volunteer or staff member who will update the site. They have never seen the admin.
- **Goal:** after watching, they can log in, add or edit an event, write a news story, add a video, use drafts, and tidy up.
- **Length:** about 8 minutes 40 seconds, in 10 chapters (see the table). Chapters can also be exported as separate short clips.
- **Tone:** friendly, calm, plain English. No jargon (don't say "commit", "build", "deploy"). Say "the website updates by itself in about a minute".
- **Pace:** natural speech is about 150 words per minute, but each chapter's time slot includes pauses while things happen on screen, so the narration is paced at roughly 90 to 140 words per minute (see Editing notes). Leave about 0.5 seconds of silence between sentences.
- **Style:** minimal, flat and editorial, in keeping with the site. No game-like effects. Use simple zoom or highlight rings on the element being discussed, and chapter title cards of 2 seconds.
- **Resolution:** record the browser at 1920×1080, with the window at a desktop width (no mobile view).

## Before recording: setup and safety

- **Site address:** the public site is `https://beachvolleyballtv.com.au` once the domain is connected (until then `https://beach-volleyball-tv.coopercine.workers.dev`). The **admin is always** at `https://beach-volleyball-tv.coopercine.workers.dev/admin/`. Ask the site owner for the username and password.
- **Never show the password** on screen or in the narration. Pre-fill it, cut the typing, or mask the field in editing. Don't write it into any file in this repository.
- **This is the live site.** Saving creates real changes. To keep it safe:
  - Build every demo item as a **Draft** until the chapters about publishing. Use names that make it obvious it's a demo (e.g. "Demo: Sunset Social").
  - When finished, **delete all demo events and stories** (Chapter 6 shows how) and remove demo videos from the Library.
  - Don't change or delete existing real content in the video.
- **Publishing delay:** a published change appears on the public site after about a minute. Either record the "it's live" shot later and cut it in, or wait for it and speed-ramp the waiting time. The admin shows "…will be live in about a minute" after saving.
- **Demo photo:** use a clean horizontal beach volleyball photo (any size). It will be cropped to 16:10. Keep a copy in a known folder.
- **Demo YouTube link:** use any public video from the Beach Volleyball TV YouTube channel.
- **Browser automation:** if using Claude in Chrome (`mcp__claude-in-chrome__*`), load the tools first, start with `tabs_context_mcp`, and open the site in a new tab. A GIF or screen-recording of each chapter makes editing easier. Don't trigger browser pop-up dialogs. The admin uses in-page dialogs, which are fine.
- **Voice-over:** record narration after the screen capture so the timing can be adjusted to the actions.

## Chapter overview

| # | Chapter | Start | Length |
| --- | --- | --- | --- |
| 1 | Welcome: how the website is put together | 0:00 | 0:30 |
| 2 | Logging in | 0:30 | 0:25 |
| 3 | The Dashboard | 0:55 | 0:35 |
| 4 | Adding an event | 1:30 | 2:10 |
| 5 | Weekly events and featuring an event | 3:40 | 0:40 |
| 6 | Finding, editing and deleting events | 4:20 | 0:45 |
| 7 | Writing a news story | 5:05 | 1:25 |
| 8 | Adding YouTube videos and athlete profiles | 6:30 | 1:05 |
| 9 | Drafts and previews | 7:35 | 0:35 |
| 10 | Handy tips and logging out | 8:10 | 0:30 |

## Screen map: what to click, and where the result appears

Admin URLs (add to the site address). Selectors are for automation; the label is what a viewer sees.

| Where | URL | Key elements (label → selector) |
| --- | --- | --- |
| Login | `/admin/login/` | Username `#username`, Password `#password`, **Log in** `button[type=submit]` |
| Left menu | every admin page | **Dashboard / Events / News / Videos** `.adm-side nav a`; **View website** `.adm-side__foot a`; **Log out** `.adm-side__foot form button` |
| Dashboard | `/admin/` | Stat boxes `.stats .stat`; **Quick actions** `.quick a`; **Coming up** / **Latest stories** `.mini-list` |
| Events list | `/admin/events/` | **+ Add new event** `a[href="/admin/events/new/"]`; tabs `[data-list-filter="all|upcoming|past|draft"]`; **Search** `[data-list-search]`; row `[data-row]`; **Delete** `[data-row-delete]`; **Select all past events** `[data-select-past]`; **Delete selected** `[data-bulk-delete]` |
| Event editor | `/admin/events/new/` or `/admin/events/<slug>/` | Form `[data-editor="events"]`. Name `#title`; Short summary `#excerpt`; Full description `#description`; Date `#date`; Starts `#startTime`; Finishes `#endTime`; Last day `#endDate`; Time note `#timeNote`; Repeats `#recurring`; Venue `#venue`; Suburb `#suburb`; Price `#price`; Who it's for `#level`; Format `#format`; What's included `#includes`; Button text `#ctaLabel`; When clicked `#cta`; Web link `#ctaUrl`; Published/Draft `input[name=draft]`; Feature `input[name=featured]`; Event type `select[name=type]`; Photo `[data-image-picker]`; **Publish / Save changes** `button[type=submit]`; **Delete** `[data-editor-delete]` |
| Photo picker and cropper | inside any editor | **Choose photo** `[data-picker-choose]`; drop area `[data-picker-drop]`; Describe the photo `#image-alt`; crop window `[data-cropper]` with **Zoom** `[data-crop-zoom]` and **Use this photo** `[data-crop-ok]` |
| Confirm window | any delete | `[data-confirm]`, confirm button `[data-confirm-ok]` |
| News list | `/admin/news/` | **+ Write new story** link; tabs `[data-list-filter="all|published|draft"]`; search `[data-list-search]` |
| Story editor | `/admin/news/new/` or `/admin/news/<slug>/` | Headline `#title`; Summary `#excerpt`; text style `[data-rich-style]`; toolbar buttons `[data-cmd="bold|italic|underline|bulletList|orderedList|blockquote|link|photo|video|undo|redo"]`; story page `[data-rich-editor]`; Category `select[name=category]`; Publish date `#date`; Author `#author`; Main photo `[data-image-picker]` |
| Videos | `/admin/videos/` | Link box `#yt-url`; **Find video** `[data-yt-lookup]`; Title `#yt-title`; Category `#yt-cat`; Description `#yt-desc`; **Add to library** `[data-yt-add]`; list `[data-video-rows]` (each row: **Move up** / **Move down** buttons, **Featured** checkbox, **Athlete name** box, **✕** Remove); **Save changes** `[data-videos-save]` |
| Toast / messages | all | Green or red message `.notice`, pop-up `[data-toast]` |

Where content appears on the public site (show these when "going live"):

| You saved | Public page | Where on that page |
| --- | --- | --- |
| A published event | `/events/` | "More upcoming events" grid (`#more-title`). Its own page is `/events/<slug>/` |
| An event with **Repeats** | `/events/` and `/community/` | "Weekly events" section (`#weekly`); also the Community page |
| A **featured** event | `/events/` and `/` | Large card at the top of Events (`#featured-event`); "Coming up" spotlight on Home (`#spotlight-title`) |
| An event | `/` | "Play with us every week" (`#events-title`) shows the next few |
| A published story | `/news/` | "Latest stories" grid (`#all-stories`, `#news-grid`), filtered by the category chips (`#news-filters`) |
| A **featured** story | `/news/` | Large card at the top of the page |
| A story | `/` | "Stories from the beach" (`#news-title`) |
| A video | `/youtube/` ("Videos" in the footer and mobile menu) | "Every story, on demand" library (`#library`, `#video-grid`), category chips (`#video-filters`). The featured video is the large one at the top |
| A video | `/news/` and `/` | "Watch the latest" (`#videos-title`) and "Latest news & weekly broadcasts" (`#video-title`) |
| A video with an **Athlete name** | `/athletes/` | A profile card with the "Athlete profile" label and the name as heading |

Public site menu labels: **Home, News & Media, Athletes, Events, Community, About, Contact** (Videos, Partners & Sponsors and Get Involved are in the footer and mobile menu).

## Script, chapter by chapter

Each chapter has: **time**, **screen** (URL and what to do), **narration** (read aloud, in plain text) and **highlight** (what to ring or zoom on, with timing offsets from the chapter start).

### 1. Welcome (0:00 – 0:30)

- **Screen:** Start on the Home page `/`. Slow scroll to "Latest news & weekly broadcasts", then "Stories from the beach", then "Play with us every week". End by opening `/admin/` in the address bar (don't show the login yet).
- **Narration (62 words):**
  "Welcome! This short video shows you how to update the Beach Volleyball TV website yourself. Everything you see on the public site, the events, the news stories and the videos, is managed from one place: the admin. There's nothing to install and no code to touch. You just log in, fill in a form, and press Save. Let's start by logging in."
- **Highlight:** 0:05 ring the events strip; 0:12 ring the news cards; 0:18 ring the video band.

### 2. Logging in (0:30 – 0:55)

- **Screen:** `/admin/login/`. Click **Username**, type `admin` (or the given username); click **Password** (mask or cut the typing); click **Log in**.
- **Narration (56 words):**
  "Add slash admin to the end of the website address. Type your username and password, and press Log in. You'll stay logged in for a week. If you get the password wrong too many times, you're locked out for ten minutes, so take it slowly. If you don't have a password yet, ask the site owner."
- **Highlight:** 0:05 ring the address bar; 0:12 ring the form; 0:20 ring **Log in**.

### 3. The Dashboard (0:55 – 1:30)

- **Screen:** `/admin/`. Slowly highlight, in order: the left menu, "At a glance", "Quick actions", "Coming up", and the **View website** link.
- **Narration (74 words):**
  "This is the Dashboard. On the left is the menu: Events, News and Videos. Those are the three things you'll edit. At a glance shows how much is on the site, and if you have drafts or finished events, it'll let you know. Quick actions are shortcuts for the most common jobs. And at the bottom left, View website opens the public site in a new tab, so you can always check your work."
- **Highlight:** 0:04 ring the menu; 0:14 ring "At a glance"; 0:21 ring "Quick actions"; 0:30 ring **View website**.

### 4. Adding an event (1:30 – 3:40)

- **Screen:** Click **Events** → **+ Add new event** (`/admin/events/new/`). Then, in order:
  1. Type the name in `#title` ("Demo: Sunset Social").
  2. Fill **Short summary** and **Full description** (type a blank line between two paragraphs).
  3. In **When**: set **Date**, **Starts** and **Finishes**.
  4. In **Where**: **Venue** "Bondi Beach, south end courts", **Suburb** "Bondi Beach, NSW".
  5. In **Details**: **Price** "Free", **Who it's for** "All levels", **What's included** two lines.
  6. In **Sign-up button**: **Button text** "Join the WhatsApp group", **When clicked** "Open a web link", paste any link.
  7. On the right: **Event type** "Community".
  8. **Event photo**: click **Choose photo**, pick the demo photo, drag it in the cropper, move the **Zoom** slider, keep the subject inside the dotted line, click **Use this photo**. Type a description in **Describe the photo**.
  9. In **Publish**, choose **Draft** (for the demo). Click **Publish**.
  10. Show the green message, then click **Preview draft**.
- **Narration (274 words, in 4 parts):**
  - *(0:00 – 0:20)* "Let's add an event. Click Events in the menu, then Add new event. Start with the event name at the top, and a short summary. This is the text people see on the event cards, so one or two sentences is plenty."
  - *(0:20 – 0:55)* "Below that is the full description. Write as much as you like, and leave an empty line wherever you want a new paragraph. Next, tell people when. Choose the date and the start time. The finish time is optional. If there's no fixed time, you can use the Time note box instead, for example, 'ten a.m. till late'. Then say where it is: the venue, and the suburb."
  - *(0:55 – 1:25)* "In Details, add the price, and who it's for. In What's included, put one item per line. The sign-up button is what people click to join. Type the button text, then choose what it does. You can open a web link, like a WhatsApp or Instagram group, or open the contact form."
  - *(1:25 – 2:10)* "On the right, choose the event type. Now the photo. Click Choose photo, and pick any picture, at any size. A cropping window opens. Drag the photo to move it, and use the slider to zoom. Keep the important part, like faces and the ball, inside the dotted line, because that area shows everywhere on the site. Click Use this photo. Add a short description of the picture, which helps people using screen readers. Finally, under Publish, choose Published to put it on the website, or Draft to keep it hidden for now. Click Publish. You'll see a green message, and the event appears on the website in about a minute."
- **Highlight:** 0:02 ring **+ Add new event**; 0:10 ring **Short summary**; 0:28 ring **Time note**; 0:40 ring **Venue**; 1:00 ring **Sign-up button**; 1:30 ring the photo box; 1:42 ring the dotted line in the cropper (`.adm-cropper__safe`); 1:58 ring **Publish**; 2:05 ring the green message.
- **Capture note:** while the narration says "in about a minute", cut to a 3-second "about a minute later" title card, then show the event on `/events/` (see "Where content appears"). If recording the demo as Draft, show it in the Drafts tab and the preview instead.

### 5. Weekly events and featuring an event (3:40 – 4:20)

- **Screen:** Open the demo event (`/admin/events/<slug>/`). In **When**, type "Every Tuesday" in **Repeats**. Tick **Feature this event**. Click **Save changes**. Then briefly show `/events/` (the weekly section and the featured card).
- **Narration (85 words):**
  "Have a game that happens every week? Type it in the Repeats box, for example 'Every Tuesday'. It then appears in the Weekly events area, and on the Community page. If a program finishes, add a last day, and it will drop off the website after that day. To make an event stand out, tick Feature this event. It's shown large at the top of the Events page, and on the home page. Press Save changes, and it updates by itself in about a minute."
- **Highlight:** 0:04 ring **Repeats**; 0:15 ring **Last day**; 0:24 ring **Feature this event**; 0:32 ring **Save changes**.

### 6. Finding, editing and deleting events (4:20 – 5:05)

- **Screen:** `/admin/events/`. Click the tabs **Upcoming**, **Past**, **Drafts**. Type in **Search**. Hover a row to show **Edit / View / Delete**. Tick the demo event's box and click **Delete selected**; show the confirm window and click **Delete**. Briefly show **Select all past events** (don't click it on the live site).
- **Narration (89 words):**
  "The Events list shows everything. Use the tabs to see only upcoming events, past events, or drafts, and the Search box to find one by name. Hover over a row to edit it, view it on the website, or delete it. To delete several at once, tick their boxes and press Delete selected. There's even a button that ticks every finished event for you. You'll always be asked to confirm, and deleting can't be undone. Finished events leave the public site by themselves, so deleting is just tidying up."
- **Highlight:** 0:03 ring the tabs; 0:10 ring **Search**; 0:16 ring the row links; 0:24 ring **Delete selected**; 0:31 ring **Select all past events**; 0:36 ring the confirm window.

### 7. Writing a news story (5:05 – 6:30)

- **Screen:** **News** → **+ Write new story** (`/admin/news/new/`). Type a **Headline** ("Demo: A day at the beach") and **Summary**. In the white page, type a line, then apply **Heading** from the style menu; select a word and press **B**; add a short bullet list; select words, press **Link** and paste a web address; click **Photo** and choose the demo photo; click **Video** and paste a YouTube link. On the right, choose a **Category**, add a **Main photo**, set the date. Choose **Draft**, press **Publish**.
- **Narration (125 words, in 3 parts):**
  - *(0:00 – 0:25)* "To write a news story, click News, then Write new story. Type the headline and a short summary, which shows on the story cards and in Google."
  - *(0:25 – 1:05)* "Then just write in the big white page, like a Word document. Use the style menu to make headings. Use these buttons for bold, italics, and lists. To add a link, select some words, press Link, and paste the address. Already wrote your story in Word or Google Docs? Copy it and paste it straight in. The formatting comes across, and anything messy is cleaned up."
  - *(1:05 – 1:25)* "Photo adds a picture, and Video lets you paste a YouTube link. On the right, pick a category, choose the main photo, and the date. Choose Published or Draft, and press Publish."
- **Highlight:** 0:04 ring **Headline**; 0:12 ring **Summary**; 0:30 ring the style menu; 0:36 ring **B / I / U** and lists; 0:46 ring **Link**; 1:06 ring **Photo** and **Video**; 1:14 ring **Category** and **Main photo**; 1:20 ring **Publish**.

### 8. Adding YouTube videos and athlete profiles (6:30 – 7:35)

- **Screen:** **Videos** (`/admin/videos/`). Paste a link into `#yt-url`, click **Find video**, check **Title**, choose **Category**, click **Add to library**. Show the new video at the top of the **Library**. Use **Move down** and **Move up**. Tick **Featured** on a demo video. Type a name in **Athlete name**. Click **Save changes** (bottom bar). Then show `/youtube/` and `/athletes/`.
- **Narration (114 words):**
  "Now videos. Copy a video's address from YouTube, paste it into the box, and click Find video. The title fills in by itself, so just check it, choose a category, and click Add to library. New videos appear at the top of the list. Use the arrows to move a video up or down. Tick Featured to show one first. To give a video its own profile on the Athletes page, type the athlete's name in the Athlete name box. The cross removes a video from the website's library, but it doesn't delete it from YouTube. And one important thing: nothing in this list is saved until you click Save changes at the bottom."
- **Highlight:** 0:04 ring the link box; 0:10 ring **Find video**; 0:22 ring **Add to library**; 0:30 ring the arrows; 0:36 ring **Featured**; 0:42 ring **Athlete name**; 0:48 ring ✕; 0:55 ring **Save changes**.

### 9. Drafts and previews (7:35 – 8:10)

- **Screen:** Open the demo story or event. Under **Publish**, click **Draft** and **Save changes**. Click **Preview draft** (a new tab with a "Draft preview" banner). Back in the editor, choose **Published** and save. Briefly show the **Drafts** tab in the Events list.
- **Narration (69 words):**
  "Not ready to publish? Choose Draft before you save. A draft stays hidden from the public, and only you can see it, while you're logged in. Click Preview draft to see exactly how it will look. When you're happy, switch it to Published and save again. You can find all your drafts in the list, using the Drafts tab. The Dashboard also reminds you how many drafts are waiting."
- **Highlight:** 0:04 ring **Draft**; 0:12 ring **Preview draft**; 0:18 ring the "Draft preview" banner; 0:26 ring **Published**; 0:30 ring the **Drafts** tab.

### 10. Handy tips and logging out (8:10 – 8:40)

- **Screen:** Show the editor with an unsaved change and press **Cmd/Ctrl + S**. Then click **View website**, then back and click **Log out**. End on a clean title card: "Beach Volleyball TV: you've got this."
- **Narration (69 words):**
  "A few handy tips. Press Control S, or Command S on a Mac, to save the page you're editing. If something can't be saved, a red box explains what's missing. Remember, changes take about a minute to appear on the website, so if you don't see them yet, wait and refresh. When you're finished, click Log out. That's it. You're ready to keep the website fresh. Thanks for watching!"
- **Highlight:** 0:04 ring the save shortcut caption; 0:12 ring a red error box (if possible, trigger it by leaving the event name empty and pressing Publish); 0:20 ring **Log out**.

## Editing notes

- Total narration is 1,017 words, about 6 minutes 50 seconds of speech at 150 words per minute, inside an 8:40 video. The rest is silence for on-screen action and chapter cards, so each chapter's narration should be paced slower than 150 words per minute (about 90 to 140). Chapters 4 (photo cropping) and 7 (the editor) have the most action. If a chapter runs long, trim narration in Chapters 6 and 8 first.
- Keep zoom-ins to 1.15× to 1.3× on the element being discussed. Return to full view between steps.
- Captions: add burned-in captions from the narration text (it's plain text on purpose).
- Chapter markers: use the table at the top of this part as the chapter list for YouTube or a video player.
- After recording, **check that no password, token or demo content is left** on the live site or in the video.
