# AGENTS.md

Guidance for any AI agent working in this repo.

## Project
A fun Rickroll website, deployed to GitHub Pages. Plain static site (no build step).

## Flow
1. Page loads a friendly light "Quick security check" card with an "I'm not a robot" checkbox (no ominous spinner/loading screen).
2. Clicking the checkbox shows a brief spinner, then a green check, and enables the blue "Verify" button. This is a fake check; both clicks are the user gestures that let the video play with sound.
3. Clicking Verify starts the ad-free YouTube player with autoplay, filling the window. Fullscreen is intentionally NOT requested (it caused the video to start muted); revisit only if sound is solved another way.

4. ~0.7s after the video actually starts playing (timer only starts on the player's PLAYING state) (`REVEAL_AFTER_MS`), the `.player` gets `.revealed`: the video smoothly shrinks to a 16:9 card at the top, the page becomes scrollable, and the `.after` section below shows "You've been Rickrolled!". `.after` holds a two-column `.after-grid`: the left column is the profile card ("You've been rickrolled by Retrac!", avatar `assets/profile.jpg`, description, and "GitHub Repo" / "GitHub Profile" link cards); the right column is the "Rickroll Counter" card (live count in `#counter`, see "Counter" below; do not add "example" text to the page).

5. "Mayhem": measured from when the video starts playing, photos of Rick fall at the left and right edges from 3.0s to 6.6s (`MAYHEM_START_MS` / `MAYHEM_END_MS` in `script.js`) in a fixed `#pile` overlay (`pointer-events: none`). Physics is a small loose rAF sim (gravity, air drag, flutter sway, tumbling, bounce, then a flop to a resting tilt) and a per-side heightmap. The pile is capped at ~2-3 rows (`PILE_MAX_PX`); once full, later photos pass straight through it and fall off the screen. Images: `assets/rickroll.png`, `assets/rickroll.jpeg`, and three CC-licensed Wikimedia photos in `assets/falling/` (credits in `assets/falling/CREDITS.md`; keep it updated when adding images). Then `PILE_RELEASE_AFTER_MS` (2.77s) after the falling stops (so ~9.37s after playback starts), whatever is still piled up drops through the bottom of the screen and is removed (`releasePile()`). Reduced-motion users get a static pile with no falling (it just disappears at release time).

## School-filter warm-up
Some school web filters scan each new window and show a loading screen for ~3.63s. `script.js` handles it for every entry page:
- `looksFiltered()` tries `fetch("https://sites.google.com/", { mode: "no-cors" })`; a network error/timeout means "probably filtered" (school filters usually block Google Sites), success means a normal network. A cross-origin iframe or fetch can't see where a redirect ended up, so this is only a guess. `?warmup=1` forces the warm-up, `?warmup=0` skips it (for testing).
- Only if filtered: the player is created early in a hidden `standby` state (`.player.standby`, paused, silent, invisible), and `warmupDone` resolves `FILTER_HOLD_MS` (3.63s) after it is ready (with an 8s failsafe). On a normal machine `warmupDone` is already resolved, so nothing is delayed.
- Intro screens must wait for `warmupDone`: the root page doesn't show "You're human!" and the games loader stays at 99% until it resolves. New entry pages should do the same before enabling their start button.
- When the visitor presses the start button, `startRickroll()` removes `standby` and plays the already-loaded video.
- Never mention any of this in text visitors can see (page copy, titles, alt text); filters read page content. Code comments and this file are fine.

## Variations (entry pages)
The Rickroll itself (steps 3-5 + counter) is shared; only the intro screen differs per entry page. `script.js` injects the video player, the "You've been Rickrolled!" section, the falling-photo layer and the GitHub icon into every page that loads it, so don't copy that markup into HTML files. An entry page needs:
- an element with `id="stage"` (it fades out on start),
- one or more elements with the `data-rickroll-start` attribute (clicking one starts the show; it must be a real user click so audio works),
- `<script src="../script.js">` (relative to the page; `script.js` resolves asset paths against the site root via `SITE_ROOT`, so pages in subfolders work),
- `../style.css` for the shared player styles, plus its own CSS. Wrap any page-specific JS in an IIFE (classic scripts share globals with `script.js`, e.g. `render`, `player`, `stage`).

Pages:
- `/` (`index.html`): the "Quick security check" intro (steps 1-2), `Verify` is the start button.
- `/games/` (`games/index.html`, `games.css`, `games.js`): fake "GamerNow" games site in glossy candy pink/purple (owner-supplied logo `assets/games/gamernow-logo.png`). Shows the logo, a fake loading bar (`LOAD_MS`, uneven progress, silly tips), then the bar fades out and a "Play Now! →" logo-button pops in (CSS layered-outline text in Fredoka; stars/sparkles are inline SVG). Clicking it starts the Rickroll. Fredoka is scoped to the `.gn-stage` intro only; the Rickroll that follows (player, "You've been Rickrolled!", cards) must stay Inter, so never set Fredoka on `body`.

## Files
- `index.html`, `style.css`, `script.js`: the root page and the shared Rickroll engine.
- `games/`: the `/games/` variation.
- `assets/`: images (`rickroll.png` transparent, `rickroll.jpeg`, `profile.jpg` = the owner's avatar); `assets/games/` has the GamerNow logo.
- `assets/falling/`: photos for the falling effect (+ `CREDITS.md`).
- `.nojekyll`: keeps GitHub Pages from running Jekyll.

## Conventions
- Font: Inter.
- Embed: use the YouTube IFrame API with `host: "https://www.youtube-nocookie.com"` (ad-free), created inside the Continue click. Playback starts via `playVideo()`; if sound-on autoplay is blocked, fall back to muted autoplay plus a "Tap to unmute" button. Do NOT use `tube.rvere.com/embed` (click-to-play facade inside a cross-origin iframe, cannot autoplay) or standard youtube.com embeds (ads).
- Playback is locked (no pausing/seeking): `controls: 0`, `disablekb: 1`, a transparent `.shield` div over the iframe to swallow clicks (the unmute button sits above it), and a `PAUSED` handler that calls `playVideo()`. Keep the unmute button above the shield.
- Keep animations, and respect `prefers-reduced-motion`.
- Use relative asset paths (Pages serves from a subpath).

## Rules
- **Do not edit `README.md`.** The owner maintains it.
- `CLAUDE.md` only contains `@AGENTS.md`. Put all guidance here.
- **After finishing ANY request from the owner, always commit and open a PR without being asked.** Work on a fresh branch cut from the latest `origin/main` (never commit directly to `main`), push it, and open a PR into `main`. Only add PR comments if the owner asks.

## Counter
- The count lives on the free Abacus counter service (`https://abacus.jasoncameron.dev`), namespace `retracdev-rickroll`, key `rickrolls` (`COUNTER_HIT_URL` in `script.js`). It is outside the repo, so it survives GitHub Pages / Actions deploys and changes without any redeploy.
- On every page load `script.js` calls `/hit/...` once (atomic increment, returns `{"value": n}`) and writes the result into `#counter`. No cookies/localStorage, so reloads count again. If the request fails or times out, `#counter` shows `—`.
- Abacus has no auth, so anyone can call the hit URL and bump the number; fine for a joke site. Every page load of any entry page bumps the counter, including local/headless test loads; the owner doesn't mind test hits, so don't go out of your way to avoid them. If the service ever disappears, swap `COUNTER_HIT_URL` (a Cloudflare Worker + KV would be the next option).

## Planned (not yet built)
- "About Me" section and GitHub link.
