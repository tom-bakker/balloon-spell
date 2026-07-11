# Balloon Spell

A spelling + maths balloon-popping game for kids, built as an installable PWA (no build step, no frameworks — plain HTML/CSS/JS).

Mainly Vibed using Sonnet 5.

### Installing it as an app

Once it's live over HTTPS (GitHub Pages always is), open the URL on a phone
or in Chrome/Edge on desktop:
- **Android/desktop Chrome:** an install icon appears in the address bar, or
  use the browser menu → *Install app* / *Add to Home screen*.
- **iOS Safari:** Share button → *Add to Home Screen* (Safari doesn't show an
  automatic install prompt, but this achieves the same result).

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
