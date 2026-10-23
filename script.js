const VIDEO_ID = "dQw4w9WgXcQ";
// How long the fake "verifying" spinner shows after the checkbox click.
const VERIFY_MS = 1100;
// How long to wait for playback to start before falling back to muted autoplay.
const AUTOPLAY_CHECK_MS = 1500;
// How long the video plays fullscreen-sized before shrinking to reveal the page below.
const REVEAL_AFTER_MS = 2500;

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
