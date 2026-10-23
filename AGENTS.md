# AGENTS.md

Guidance for any AI agent working in this repo.

## Project
A fun Rickroll website, deployed to GitHub Pages. Plain static site (no build step).

## Flow
1. Page loads a friendly light "Quick security check" card with an "I'm not a robot" checkbox (no ominous spinner/loading screen).
2. Clicking the checkbox shows a brief spinner, then a green check, and enables the blue "Verify" button. This is a fake check; both clicks are the user gestures that let the video play with sound.
3. Clicking Verify starts the ad-free YouTube player with autoplay, filling the window. Fullscreen is intentionally NOT requested (it caused the video to start muted); revisit only if sound is solved another way.

4. ~0.7s after the video actually starts playing (timer only starts on the player's PLAYING state) (`REVEAL_AFTER_MS`), the `.player` gets `.revealed`: the video smoothly shrinks to a 16:9 card at the top, the page becomes scrollable, and the `.after` section below shows "You've been Rickrolled!". `.after` holds a two-column `.after-grid`: the left column is the profile card ("You've been rickrolled by Retrac!", avatar `assets/profile.jpg`, description, and "GitHub Repo" / "GitHub Profile" link cards); the right column is the "Rickroll Counter" card (currently a static `0` in `#counter`, to be hooked up to real analytics later; do not add "example" text to the page).

## Files
- `index.html`, `style.css`, `script.js`: the whole site.
- `assets/`: images (`rickroll.png` transparent, `rickroll.jpeg`, `profile.jpg` = the owner's avatar).
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

## Planned (not yet built)
- Rickroll counter (analytics-backed; every visit counts, even from the same browser).
- "About Me" section and GitHub link.
