const VIDEO_ID = "dQw4w9WgXcQ";
const LOADER_MS = 1800;
// How long to wait for playback to start before falling back to muted autoplay.
const AUTOPLAY_CHECK_MS = 1500;

const stage = document.getElementById("stage");
const loader = document.getElementById("loader");
const button = document.getElementById("continue");
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

// Show a short "loading" screen, then a button whose click is the user gesture
// that lets the browser play the video with sound.
setTimeout(() => {
  loader.classList.add("done");
  setTimeout(() => {
    loader.hidden = true;
    button.hidden = false;
    button.focus({ preventScroll: true });
  }, 400);
}, LOADER_MS);

button.addEventListener("click", () => {
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
      disablekb: 1,
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

function onStateChange(event) {
  // Belt and braces for looping.
  if (event.data === YT.PlayerState.ENDED) {
    event.target.seekTo(0);
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
