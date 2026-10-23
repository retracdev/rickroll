# AGENTS.md

Guidance for any AI agent working in this repo.

## Project
A fun Rickroll website, deployed to GitHub Pages. Plain static site (no build step).

## Flow
1. Page loads and shows a spinner for ~1.8s (so the user has time to interact).
2. A blue "Continue" button with an arrow appears.
3. Clicking it requests fullscreen (needs a user gesture) and loads the ad-free YouTube embed in an iframe with autoplay.

## Files
- `index.html`, `style.css`, `script.js`: the whole site.
- `assets/`: images (`rickroll.png` transparent, `rickroll.jpeg`).
- `.nojekyll`: keeps GitHub Pages from running Jekyll.

## Conventions
- Font: Inter.
- Embed URL: `https://tube.rvere.com/embed?v=dQw4w9WgXcQ&loop=1&iv_load_policy=3&disablekb=1` (+ `autoplay=1`). Do not use standard YouTube embeds (ads).
- Keep animations, and respect `prefers-reduced-motion`.
- Use relative asset paths (Pages serves from a subpath).

## Rules
- **Do not edit `README.md`.** The owner maintains it.
- `CLAUDE.md` only contains `@AGENTS.md`. Put all guidance here.
- Do not commit, push, or open PRs/comments until the owner asks.

## Planned (not yet built)
- Rickroll counter (analytics-backed; every visit counts, even from the same browser).
- "About Me" section and GitHub link.
