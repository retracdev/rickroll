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
// After the falling stops (MAYHEM_END_MS), the remaining pile falls through the screen this much later.
const PILE_RELEASE_AFTER_MS = 2770;
const FALL_IMAGES = [
  "assets/rickroll.png",
  "assets/rickroll.jpeg",
  "assets/falling/rick-stage.jpg",
  "assets/falling/rick-2023.jpg",
  "assets/falling/rick-dallas.jpg",
];

// Rickroll counter: kept on the free Abacus counter service (https://abacus.jasoncameron.dev),
// not in this repo, so it survives deploys and changes without a redeploy. Every page load
// (reloads included) hits it once; no cookies or localStorage are used.
const COUNTER_HIT_URL = "https://abacus.jasoncameron.dev/hit/retracdev-rickroll/rickrolls";
const COUNTER_TIMEOUT_MS = 8000;

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

// Count this visit as soon as the page loads (the counter card is revealed later, by which
// time the number has long since arrived). If the service is down, show a dash instead.
(async function countRickroll() {
  const counter = document.getElementById("counter");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COUNTER_TIMEOUT_MS);
  try {
    const res = await fetch(COUNTER_HIT_URL, { signal: controller.signal, cache: "no-store" });
    const { value } = await res.json();
    if (!Number.isFinite(value)) throw new Error("bad counter response");
    counter.textContent = value.toLocaleString("en-US");
  } catch {
    counter.textContent = "—";
  } finally {
    clearTimeout(timer);
  }
})();

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
// A small loose physics sim: each photo tumbles and flutters down (gravity + air drag +
// a little sideways sway), bounces and flops flat when it lands on the pile. Once the pile
// is a few rows tall, later photos pass straight through it and fall off the screen.
const pile = document.getElementById("pile");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BUCKET_PX = 8;
const PILE_MAX_PX = 190; // roughly 2-3 rows of photos per side
const MIN_BOUNCE_SPEED = 240; // px/s; slower than this and the photo settles

const FALL_IMAGES_LOADED = FALL_IMAGES.map((src) => {
  const img = new Image(); // preload so we know each aspect ratio before it falls
  img.src = src;
  return img;
});

// Per-side heightmap of the settled pile, in BUCKET_PX columns measured from the side's edge.
const heaps = { left: [], right: [] };
const flying = new Set();
let lastFrame = 0;
let looping = false;

const rand = (min, max) => min + Math.random() * (max - min);
const deg = (d) => (d * Math.PI) / 180;

function sideZoneWidth() {
  return Math.min(320, Math.max(120, window.innerWidth * 0.2));
}

function pileHeightAt(side, from, to) {
  let h = 0;
  for (let i = from; i < to; i++) h = Math.max(h, heaps[side][i] || 0);
  return h;
}

function dropPhoto(side) {
  const img = FALL_IMAGES_LOADED[Math.floor(Math.random() * FALL_IMAGES_LOADED.length)];
  if (!img.naturalWidth) return; // not loaded; skip rather than guess its shape

  const w = rand(70, 130);
  const h = Math.min(170, w * (img.naturalHeight / img.naturalWidth));
  const zone = sideZoneWidth();

  const el = document.createElement("img");
  el.className = "fall-item" + (img.src.endsWith(".png") ? "" : " photo");
  el.src = img.src;
  el.alt = "";
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.top = "0";
  el.style[side] = "0";

  const p = {
    el, side, w, h,
    hh: h * 0.4, // effective half-height for landing (rotated photos are shorter than their box)
    x: rand(w * 0.4, zone - w * 0.4), // centre, measured from this side's screen edge
    y: -h,
    vx: rand(-70, 70),
    vy: rand(0, 160),
    angle: rand(-90, 90),
    omega: rand(-260, 260), // deg/s
    gravity: rand(1500, 2300),
    swayAmp: rand(250, 800),
    swayFreq: rand(2, 5),
    swayPhase: rand(0, Math.PI * 2),
    age: 0,
    state: "falling", // falling | ghost | settling
    flop: 0,
    target: 0,
  };

  pile.appendChild(el);

  if (reducedMotion) {
    // No animation: just place it on the pile (or skip it if the pile is already tall).
    const base = baseUnder(p);
    if (base >= PILE_MAX_PX) { el.remove(); return; }
    p.y = window.innerHeight - base - p.hh;
    p.angle = rand(-18, 18);
    finalize(p, base);
    return;
  }

  render(p);
  flying.add(p);
  if (!looping) {
    looping = true;
    lastFrame = performance.now();
    requestAnimationFrame(tick);
  }
}

function baseUnder(p) {
  const from = Math.max(0, Math.floor((p.x - p.w * 0.4) / BUCKET_PX));
  const to = Math.ceil((p.x + p.w * 0.4) / BUCKET_PX);
  return pileHeightAt(p.side, from, to);
}

function render(p) {
  const tx = p.side === "left" ? p.x - p.w / 2 : -(p.x - p.w / 2);
  p.el.style.transform = `translate(${tx}px, ${p.y - p.h / 2}px) rotate(${p.angle}deg)`;
}

// Photo is at rest: anchor it to the bottom/edge so it stays put on resize, and
// raise the pile under it.
function finalize(p, base) {
  const { el, side } = p;
  el.style.top = "auto";
  el.style.bottom = `${window.innerHeight - (p.y + p.h / 2)}px`;
  el.style[side] = `${p.x - p.w / 2}px`;
  el.style.transform = `rotate(${p.angle}deg)`;
  el.dataset.settled = "1";

  const top = base + p.hh * 2;
  const from = Math.max(0, Math.floor((p.x - p.w * 0.4) / BUCKET_PX));
  const to = Math.ceil((p.x + p.w * 0.4) / BUCKET_PX);
  for (let i = from; i < to; i++) heaps[side][i] = Math.max(heaps[side][i] || 0, top);
}

function tick(now) {
  const dt = Math.min(0.033, (now - lastFrame) / 1000);
  lastFrame = now;
  const vh = window.innerHeight;

  for (const p of flying) {
    p.age += dt;

    if (p.state === "settling") {
      // Flop flat: ease the angle toward a gentle resting tilt, then lock in place.
      p.flop += dt;
      p.angle += (p.target - p.angle) * Math.min(1, dt * 14);
      render(p);
      if (p.flop > 0.3) {
        p.angle = p.target;
        finalize(p, p.base);
        flying.delete(p);
      }
      continue;
    }

    // Gravity, air drag (so they float down instead of plummeting), and a flutter sway.
    p.vy += p.gravity * dt;
    p.vy -= p.vy * Math.abs(p.vy) * 0.0016 * dt;
    p.vx += Math.sin(p.age * p.swayFreq + p.swayPhase) * p.swayAmp * dt;
    p.vx -= p.vx * 0.6 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.angle += p.omega * dt;
    p.omega -= p.omega * 0.25 * dt;

    // Don't wander off the near edge of the screen entirely.
    if (p.x < p.w * 0.2) { p.x = p.w * 0.2; p.vx = Math.abs(p.vx) * 0.5; }

    if (p.state === "falling" && p.vy > 0) {
      const base = baseUnder(p);
      if (p.y + p.hh >= vh - base) {
        if (base >= PILE_MAX_PX) {
          p.state = "ghost"; // pile is full: fall right through it
        } else if (p.vy > MIN_BOUNCE_SPEED) {
          // Bounce, losing most of the energy and picking up a random tumble.
          p.y = vh - base - p.hh;
          p.vy = -p.vy * rand(0.25, 0.45);
          p.vx = p.vx * 0.5 + rand(-90, 90);
          p.omega = p.omega * 0.4 + rand(-200, 200);
        } else {
          p.y = vh - base - p.hh;
          p.base = base;
          p.state = "settling";
          p.target = Math.round(p.angle / 360) * 360 + rand(-20, 20);
        }
      }
    }

    render(p);

    if (p.state === "ghost" && p.y - p.h > vh) {
      p.el.remove();
      flying.delete(p);
    }
  }

  if (flying.size) requestAnimationFrame(tick);
  else looping = false;
}

// Everything still piled up drops through the bottom of the screen and disappears.
function releasePile() {
  // Anything still in the air just keeps falling through.
  for (const p of flying) p.state = "ghost";
  heaps.left.length = 0;
  heaps.right.length = 0;

  const vh = window.innerHeight;
  pile.querySelectorAll(".fall-item[data-settled]").forEach((el) => {
    if (reducedMotion) { el.remove(); return; }
    const angle = parseFloat(/rotate\(([-\d.]+)deg\)/.exec(el.style.transform)?.[1]) || 0;
    const anim = el.animate(
      [
        { transform: `translateY(0) rotate(${angle}deg)` },
        { transform: `translateY(${vh}px) rotate(${angle + rand(-60, 60)}deg)` },
      ],
      { duration: rand(800, 1300), delay: rand(0, 350), easing: "cubic-bezier(0.55, 0, 1, 0.45)", fill: "forwards" }
    );
    anim.onfinish = () => el.remove();
  });
}

function scheduleMayhem() {
  setTimeout(releasePile, MAYHEM_END_MS + PILE_RELEASE_AFTER_MS);
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
