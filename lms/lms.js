// "LMS Max" variation: a fake app-install page. Pressing Install runs a fake installer; when it
// reaches 100% a Start button appears. Start carries data-rickroll-start, so ../script.js
// handles the actual Rickroll.

// Wrapped in a function so these names can't collide with the globals in ../script.js.
(function () {
  // Total length of the fake install.
  const INSTALL_MS = 6500;
  // Progress at fractions of INSTALL_MS: [time 0..1, percent]. Uneven on purpose, with a couple
  // of near-stalls, so it feels like a real installer.
  const STEPS = [
    [0, 0], [0.12, 10], [0.3, 24], [0.34, 25], [0.5, 48], [0.62, 62], [0.72, 64], [0.84, 88], [0.9, 93], [1, 100],
  ];
  const STAGES = [
    [0, "Downloading content…"],
    [22, "Unpacking…"],
    [45, "Installing…"],
    [68, "Connecting to your school's LMS…"],
    [90, "Wrapping up…"],
  ];
  // The "extension installed" notice appears when the bar passes this percent, and goes away
  // by itself after a while (or when dismissed / when the Rickroll starts).
  const NOTICE_AT_PCT = 85;
  const NOTICE_VISIBLE_MS = 9000;
  // Pause on 100%, then this long for the bar to fade out before the "installed" message.
  const HOLD_MS = 400;
  const FADE_MS = 400;

  const html = document.documentElement;
  const cta = document.getElementById("cta");
  const install = document.getElementById("install");
  const installer = document.getElementById("installer");
  const progress = document.getElementById("progress");
  const fill = document.getElementById("fill");
  const stageLabel = document.getElementById("stage-label");
  const pct = document.getElementById("pct");
  const done = document.getElementById("done");
  const start = document.getElementById("start");
  const card = document.getElementById("ext-card");
  const cardTitle = document.getElementById("ext-title");
  const cardClose = document.getElementById("ext-close");

  // Best guess at which browser this is, for the notice. Order matters: many browsers also
  // say "Chrome" or "Safari" in their user agent.
  function browserName() {
    const ua = navigator.userAgent;
    if (/Edg(e|A|iOS)?\//.test(ua)) return "Edge";
    if (/OPR\/|Opera/.test(ua)) return "Opera";
    if (/Vivaldi\//.test(ua)) return "Vivaldi";
    if (/SamsungBrowser\//.test(ua)) return "Samsung Internet";
    if (/Firefox\/|FxiOS\//.test(ua)) return "Firefox";
    if (navigator.brave) return "Brave";
    if (/Chrome\/|CriOS\//.test(ua)) return "Chrome";
    if (/Safari\//.test(ua)) return "Safari";
    return "your browser";
  }

  function progressAt(t) {
    for (let i = 1; i < STEPS.length; i++) {
      const [t1, p1] = STEPS[i];
      if (t <= t1) {
        const [t0, p0] = STEPS[i - 1];
        return p0 + ((p1 - p0) * (t - t0)) / (t1 - t0);
      }
    }
    return 100;
  }

  let noticeShown = false;
  function showNotice() {
    noticeShown = true;
    cardTitle.textContent = `LMS Max has installed an extension to ${browserName()}`;
    card.hidden = false;
    setTimeout(hideNotice, NOTICE_VISIBLE_MS);
  }
  function hideNotice() {
    if (card.hidden || card.classList.contains("leaving")) return;
    card.classList.add("leaving");
    setTimeout(() => { card.hidden = true; }, 350);
  }
  cardClose.addEventListener("click", hideNotice);

  function render(p) {
    const whole = Math.floor(p);
    if (whole >= NOTICE_AT_PCT && !noticeShown) showNotice();
    fill.style.width = `${p}%`;
    pct.textContent = `${whole}%`;
    progress.setAttribute("aria-valuenow", String(whole));
    for (const [from, text] of STAGES) if (whole >= from) stageLabel.textContent = text;
  }

  function showDone() {
    progress.classList.add("finishing");
    setTimeout(() => {
      progress.hidden = true;
      done.hidden = false;
      start.focus({ preventScroll: true });
    }, FADE_MS);
  }

  // The bar can't reach 100% until the shared warm-up (see warmupDone in ../script.js) is over.
  // That timer starts when the page loads, not when Install is pressed, so it has usually
  // finished by now and this changes nothing.
  let warm = false;
  warmupDone.then(() => { warm = true; });

  let started = false;
  let t0 = 0;
  function frame(now) {
    if (!t0) t0 = now;
    const t = Math.min(1, (now - t0) / INSTALL_MS);
    render(warm ? progressAt(t) : Math.min(progressAt(t), 99));
    if (t < 1 || !warm) requestAnimationFrame(frame);
    else setTimeout(showDone, HOLD_MS);
  }

  install.addEventListener("click", () => {
    if (started) return;
    started = true;
    cta.hidden = true;
    installer.hidden = false;
    requestAnimationFrame(frame);
  });

  // The "Install LMS Max" button at the bottom of the page scrolls back up and does the same.
  document.querySelector(".lms-install-link").addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    install.click();
  });

  // Once the Rickroll starts, the page behind it stops scrolling.
  start.addEventListener("click", () => {
    window.scrollTo(0, 0);
    html.classList.add("started");
    hideNotice();
  });
})();
