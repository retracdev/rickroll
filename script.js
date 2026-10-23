const VIDEO_ID = "dQw4w9WgXcQ";
// How long the fake "verifying" spinner shows after the checkbox click.
const VERIFY_MS = 1100;
// How long to wait for playback to start before falling back to muted autoplay.
const AUTOPLAY_CHECK_MS = 1500;
// How long after the video actually starts playing (the timer doesn't start before that)
// it shrinks to reveal the page below.
const REVEAL_AFTER_MS = 700;

// Falling photos ("mayhem"): measured from when the video starts playing, photos fall
// from MAYHEM_START_MS until MAYHEM_END_MS, then stay piled up at the bottom.
const MAYHEM_START_MS = 3000;
const MAYHEM_END_MS = 6600;
const MAYHEM_SPAWN_EVERY_MS = 130;
const FALL_IMAGES = [
  "assets/rickroll.png",
  "assets/rickroll.jpeg",
  "assets/falling/rick-stage.jpg",
  "assets/falling/rick-2023.jpg",
  "assets/falling/rick-dallas.jpg",
];

const stage = document.getElementById("stage");
const check = document.getElementById("check");
const checkLabel = document.getElementById("check-label");
const verify = document.getElementById("verify");
const player = document.getElementById("player");
const unmute = document.getElementById("unmute");

// Load the YouTube IFrame API up front (from the youtube-nocookie player host, so no
// ads/cookies tracking) so the player can be created the instant the user clicks.
// tube.rvere.com/embed is only a click-to-play facade, so it can't autoplay.
const apiReady = new Promise((resolve) => {
  window.onYouTubeIframeAPIReady = resolve;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
});

// Fake "I'm not a robot" check. Both clicks (checkbox, then Verify) are real user
// gestures, which is what lets the browser play the video with sound.
check.addEventListener("click", () => {
  if (check.classList.contains("verifying") || check.classList.contains("done")) return;

  check.classList.add("verifying");
  checkLabel.textContent = "Verifying…";

  setTimeout(() => {
    check.classList.remove("verifying");
    check.classList.add("done");
    check.setAttribute("aria-checked", "true");
    checkLabel.textContent = "You're human!";

    verify.disabled = false;
    verify.classList.add("ready");
    verify.focus({ preventScroll: true });
  }, VERIFY_MS);
});

verify.addEventListener("click", () => {
  // Fullscreen is intentionally not requested: it made the video start muted.
  stage.classList.add("leaving");
  player.hidden = false;
  document.title = "Never Gonna Give You Up";

  apiReady.then(startPlayer);
});

function startPlayer() {
  new YT.Player("yt", {
    host: "https://www.youtube-nocookie.com",
    videoId: VIDEO_ID,
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      loop: 1,
      playlist: VIDEO_ID, // YouTube only loops when playlist is set
      iv_load_policy: 3,
      controls: 0, // hide the pause / seek / volume bar
      fs: 0,
      modestbranding: 1,
      disablekb: 1, // no keyboard pause/seek
      rel: 0,
      playsinline: 1,
    },
    events: {
      onReady: onReady,
      onStateChange: onStateChange,
    },
  });
}

function onReady(event) {
  const yt = event.target;
  yt.unMute();
  yt.playVideo();

  // If the browser blocked sound-on autoplay, the video won't start.
  // Fall back to muted autoplay (always allowed) and offer an unmute button.
  setTimeout(() => {
    const state = yt.getPlayerState();
    if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
      yt.mute();
      yt.playVideo();
      showUnmute(yt);
    }
  }, AUTOPLAY_CHECK_MS);
}

let revealScheduled = false;

function onStateChange(event) {
  // Once the video actually starts playing, wait a few seconds and then shrink it.
  if (event.data === YT.PlayerState.PLAYING && !revealScheduled) {
    revealScheduled = true;
    setTimeout(() => player.classList.add("revealed"), REVEAL_AFTER_MS);
    scheduleMayhem();
  }

  // Belt and braces for looping.
  if (event.data === YT.PlayerState.ENDED) {
    event.target.seekTo(0);
    event.target.playVideo();
  }
  // Never stay paused (e.g. if something slips past the click shield).
  if (event.data === YT.PlayerState.PAUSED) {
    event.target.playVideo();
  }
}

function showUnmute(yt) {
  unmute.hidden = false;
  unmute.addEventListener("click", () => {
    yt.unMute();
    yt.setVolume(100);
    yt.playVideo();
    unmute.hidden = true;
  }, { once: true });
}

// ---- Falling photos -------------------------------------------------------------
const pile = document.getElementById("pile");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FALL_GRAVITY = 2600; // px/s^2
const BUCKET_PX = 8;

// Preload so we know each image's aspect ratio before it falls.
const fallImages = FALL_IMAGES.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// Per-side "heightmap" of the pile, in BUCKET_PX-wide columns across the side zone.
// Each landing photo rests on the tallest column it covers, then raises those columns.
const heaps = { left: [], right: [] };

function sideZoneWidth() {
  return Math.min(320, Math.max(120, window.innerWidth * 0.2));
}

function dropPhoto(side) {
  const img = fallImages[Math.floor(Math.random() * fallImages.length)];
  if (!img.naturalWidth) return; // not loaded; skip rather than guess its shape

  const zone = sideZoneWidth();
  const width = 70 + Math.random() * 60;
  const height = Math.min(170, width * (img.naturalHeight / img.naturalWidth));
  const zoneX = Math.random() * Math.max(0, zone - width);
  // Anchor to the near screen edge so the pile stays put if the window is resized.
  const edge = side === "left" ? zoneX : zone - zoneX - width;

  // Footprint a bit smaller than the box so rotated photos interlock instead of floating.
  const heap = heaps[side];
  const from = Math.floor(zoneX / BUCKET_PX);
  const to = Math.ceil((zoneX + width) / BUCKET_PX);
  let base = 0;
  for (let i = from; i < to; i++) base = Math.max(base, heap[i] || 0);
  const top = base + height * 0.7;
  if (top > window.innerHeight * 0.75) return; // pile is tall enough; keep it on screen
  for (let i = from; i < to; i++) heap[i] = top;

  const el = document.createElement("img");
  el.className = "fall-item" + (img.src.endsWith(".png") ? "" : " photo");
  el.src = img.src;
  el.alt = "";
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  el.style[side] = `${edge}px`;
  el.style.bottom = `${base}px`;

  const finalAngle = (Math.random() - 0.5) * 50;
  const finalTransform = `rotate(${finalAngle}deg)`;
  el.style.transform = finalTransform;
  pile.appendChild(el);

  if (reducedMotion) return;

  // Start just above the top of the screen, spinning, and accelerate down like gravity.
  const dist = window.innerHeight - base;
  const seconds = Math.sqrt((2 * dist) / FALL_GRAVITY);
  const spin = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 240);
  const fall = el.animate(
    [
      { transform: `translateY(${-dist}px) rotate(${finalAngle - spin}deg)` },
      { transform: `translateY(0) rotate(${finalAngle}deg)` },
    ],
    { duration: seconds * 1000, easing: "cubic-bezier(0.55, 0, 1, 0.45)" }
  );
  fall.onfinish = () => { el.style.transform = finalTransform; };
}

function scheduleMayhem() {
  setTimeout(() => {
    const started = performance.now();
    let flip = false;
    const timer = setInterval(() => {
      if (performance.now() - started >= MAYHEM_END_MS - MAYHEM_START_MS) {
        clearInterval(timer);
        return;
      }
      flip = !flip;
      dropPhoto(flip ? "left" : "right");
    }, MAYHEM_SPAWN_EVERY_MS);
  }, MAYHEM_START_MS);
}
