// "GamerNow" variation: a fake games site with a loading bar, then a big "Play Now!" button.
// The button carries data-rickroll-start, so ../script.js handles the actual Rickroll.

// Wrapped in a function so these names can't collide with the globals in ../script.js.
(function () {
  // Total length of the fake loading bar.
  const LOAD_MS = 4600;
  // Loading progress at fractions of LOAD_MS: [time 0..1, percent]. Uneven on purpose, with a
  // couple of near-stalls, so it feels like a real loader.
  const LOAD_STEPS = [
    [0, 0], [0.1, 8], [0.28, 31], [0.36, 33], [0.58, 68], [0.68, 70], [0.88, 94], [1, 100],
  ];
  const LOAD_TIPS = [
    [0, "Warming up the arcade…"],
    [25, "Polishing the pixels…"],
    [50, "Feeding the hamsters…"],
    [75, "Sharpening the swords…"],
    [93, "Almost ready…"],
  ];
  // Pause on 100%, then this long for the bar to fade out before the button pops in.
  const LOAD_HOLD_MS = 350;
  const LOAD_FADE_MS = 450;

  const loader = document.getElementById("loader");
  const fill = document.getElementById("fill");
  const tip = document.getElementById("tip");
  const pct = document.getElementById("pct");
  const play = document.getElementById("play");

  function progressAt(t) {
    for (let i = 1; i < LOAD_STEPS.length; i++) {
      const [t1, p1] = LOAD_STEPS[i];
      if (t <= t1) {
        const [t0, p0] = LOAD_STEPS[i - 1];
        return p0 + ((p1 - p0) * (t - t0)) / (t1 - t0);
      }
    }
    return 100;
  }

  function render(p) {
    const whole = Math.floor(p);
    fill.style.width = `${p}%`;
    pct.textContent = `${whole}%`;
    loader.setAttribute("aria-valuenow", String(whole));
    for (const [from, text] of LOAD_TIPS) if (whole >= from) tip.textContent = text;
  }

  function showPlayButton() {
    loader.classList.add("done");
    setTimeout(() => {
      loader.hidden = true;
      play.hidden = false;
      play.classList.add("pop");
    }, LOAD_FADE_MS);
  }

  // The bar can't reach 100% until the shared warm-up (see warmupDone in ../script.js) is over;
  // on a normal machine that is already true, so the timing is unchanged.
  let warm = false;
  warmupDone.then(() => { warm = true; });

  let loadStart = 0;
  function loadFrame(now) {
    if (!loadStart) loadStart = now;
    const t = Math.min(1, (now - loadStart) / LOAD_MS);
    render(warm ? progressAt(t) : Math.min(progressAt(t), 99));
    if (t < 1 || !warm) requestAnimationFrame(loadFrame);
    else setTimeout(showPlayButton, LOAD_HOLD_MS);
  }
  requestAnimationFrame(loadFrame);

  // Background decoration: drifting stars and sparkles.
  const floaters = document.getElementById("floaters");
  for (let i = 0; i < 18; i++) {
    const size = 14 + Math.random() * 28;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("viewBox", "0 0 100 100");
    el.classList.add("gn-float");
    el.innerHTML = `<use href="#${Math.random() < 0.5 ? "gn-star" : "gn-spark"}"/>`;
    el.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;` +
      `width:${size}px;height:${size}px;` +
      `animation-duration:${6 + Math.random() * 7}s;animation-delay:${-Math.random() * 10}s`;
    floaters.appendChild(el);
  }
})();
