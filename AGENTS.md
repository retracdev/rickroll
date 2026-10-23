# AGENTS.md

Guidance for any AI agent working in this repo.

## Project
A fun Rickroll website, deployed to GitHub Pages. Plain static site (no build step).

## Flow
1. Page loads and shows a spinner for ~1.8s (so the user has time to interact).
2. A blue "Continue" button with an arrow appears.
3. Clicking it starts the ad-free YouTube player with autoplay, filling the window. Fullscreen is intentionally NOT requested (it caused the video to start muted); revisit only if sound is solved another way.

## Files
- `index.html`, `style.css`, `script.js`: the whole site.
- `assets/`: images (`rickroll.png` transparent, `rickroll.jpeg`).
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
- Do not commit, push, or open PRs/comments until the owner asks.

## Planned (not yet built)
- Rickroll counter (analytics-backed; every visit counts, even from the same browser).
- "About Me" section and GitHub link.
