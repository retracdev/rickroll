// tube.rvere.com/embed is only a click-to-play facade around youtube-nocookie.com,
// and the click lands inside a cross-origin iframe we can't trigger. So we load the
// same youtube-nocookie player it would (same params), directly, with autoplay.
// YouTube only honors loop=1 when playlist is set to the same video ID.
const VIDEO_ID = "dQw4w9WgXcQ";
const EMBED_URL =
  `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
  `?autoplay=1&loop=1&playlist=${VIDEO_ID}&iv_load_policy=3&disablekb=1&rel=0&playsinline=1`;

const LOADER_MS = 1800;

const stage = document.getElementById("stage");
const loader = document.getElementById("loader");
const button = document.getElementById("continue");
const player = document.getElementById("player");

// Fullscreen needs a user gesture, so show a short "loading" screen,
// then a button whose click is that gesture.
setTimeout(() => {
  loader.classList.add("done");
  setTimeout(() => {
    loader.hidden = true;
    button.hidden = false;
    button.focus({ preventScroll: true });
  }, 400);
}, LOADER_MS);

button.addEventListener("click", async () => {
  // Request fullscreen first, while the click's user activation is still fresh.
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (request) {
    try { await request.call(root); } catch { /* denied: play windowed */ }
  }

  stage.classList.add("leaving");

  const iframe = document.createElement("iframe");
  iframe.src = EMBED_URL;
  iframe.title = "Video player";
  iframe.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  player.appendChild(iframe);
  player.hidden = false;

  document.title = "Never Gonna Give You Up";
});
