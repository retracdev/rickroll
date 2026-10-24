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

## Files
- `index.html`, `style.css`, `script.js`: the whole site.
- `assets/`: images (`rickroll.png` transparent, `rickroll.jpeg`, `profile.jpg` = the owner's avatar).
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
- Abacus has no auth, so anyone can call the hit URL and bump the number; fine for a joke site. For testing use a different key (e.g. `retracdev-rickroll-test`), never the real one. If the service ever disappears, swap `COUNTER_HIT_URL` (a Cloudflare Worker + KV would be the next option).

- Under the number is a green "Thanks for making the counter just a little bit higher!" pill (`#thanks`) with a pulsing green dot. Once the video starts playing it appears `THANKS_DELAY_MS` (2s, so after the card has faded in), stays `THANKS_VISIBLE_MS` (10s), then fades out (`showThanks()` in `script.js`; `.show` toggles it). It is skipped if the count request failed.

## Planned (not yet built)
- "About Me" section and GitHub link.
