# Balloon Spell

A spelling + maths balloon-popping game for kids, built as an installable PWA (no build step, no frameworks — plain HTML/CSS/JS).

## Running it locally

Service workers require a real server (not `file://`), so:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

or any static server (`npx serve`, VS Code's Live Server, etc).

## Deploying as a PWA on GitHub Pages

This repo is already structured so it works unmodified whether it's hosted at
a domain root or under a GitHub Pages project subpath
(`https://username.github.io/repo-name/`) — every path in `index.html`,
`manifest.json`, and `sw.js` is relative, with no leading slashes.

### Option A — automatic (recommended)

This repo includes `.github/workflows/deploy-pages.yml`, which deploys on
every push to `main`.

1. Push this project to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` (or run the workflow manually from the **Actions** tab).
5. After it finishes, your site is live at
   `https://<username>.github.io/<repo-name>/`.

### Option B — manual, no workflow

1. Push this project to a GitHub repository.
2. **Settings → Pages → Source**, choose **Deploy from a branch**.
3. Pick the `main` branch and the `/ (root)` folder → **Save**.
4. GitHub builds and publishes automatically after each push (takes a minute
   or two the first time).

### Installing it as an app

Once it's live over HTTPS (GitHub Pages always is), open the URL on a phone
or in Chrome/Edge on desktop:
- **Android/desktop Chrome:** an install icon appears in the address bar, or
  use the browser menu → *Install app* / *Add to Home screen*.
- **iOS Safari:** Share button → *Add to Home Screen* (Safari doesn't show an
  automatic install prompt, but this achieves the same result).

### Updating the live site

Every push to `main` re-deploys automatically (Option A) or re-publishes
(Option B). Because the service worker caches assets for offline play, it's
worth bumping `CACHE_NAME` in `sw.js` (e.g. `v2` → `v3`) whenever you ship a
change, so returning players actually fetch the new files instead of serving
their old cached copy. Players can also force this from in-app **Settings →
Clear Cache**.

## Project structure

```
index.html          entry point / all screens
manifest.json        PWA manifest (icons, name, colours)
sw.js                 service worker (offline caching)
css/style.css         all styling
js/data.js             spelling word banks + level/difficulty config
js/maths-data.js       maths question generator
js/storage.js          localStorage: profiles + per-level high scores
js/audio.js             speech synthesis + sound effects
js/balloons.js           falling balloon field (shared by both game modes)
js/game.js                spelling game session/scoring
js/maths-game.js           maths game session/scoring
js/ui.js                    shared DOM rendering helpers
js/app.js                    screen navigation + wiring everything together
icons/                        app icons (192, 512, maskable 512)
.github/workflows/deploy-pages.yml   auto-deploy to GitHub Pages
```
