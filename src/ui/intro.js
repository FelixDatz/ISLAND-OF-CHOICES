import { gameState } from "../systems/GameState.js";
import { logEvent } from "../systems/EventLog.js";

// Phase 5.1: cinematic opening -> illustrated storyboard -> landing page -> Stage 1.
// The opening is currently a lightweight CSS-animated cinematic placeholder.
// It can later be replaced by a teammate's MP4 without changing the flow API.

const INTRO_DURATION_MS = 22000;
const SKIP_UNLOCK_MS = 10000;

const STORY_SLIDES = [
  {
    eyebrow: "01 / THE VOYAGE",
    title: "A journey beyond the familiar",
    body: "You set sail across an endless blue, leaving familiar shores behind. The voyage was meant to be simple: follow the horizon, discover new waters, and return with a story worth telling.",
    scene: "voyage",
    caption: "A quiet sea. An uncertain horizon."
  },
  {
    eyebrow: "02 / THE STORM",
    title: "When the sea turns against you",
    body: "Without warning, the sky darkens. Waves crash against the ship and the crew struggles to keep it afloat. The storm is stronger than anything you have faced before.",
    scene: "storm",
    caption: "The storm gives no time for easy answers."
  },
  {
    eyebrow: "03 / THE SHIPWRECK",
    title: "Everything changes in an instant",
    body: "A violent wave tears through the deck. The ship breaks apart, and the sea carries you into darkness. When you wake, the sound of waves is the only thing you recognize.",
    scene: "wreck",
    caption: "The ship is gone. The journey is not."
  },
  {
    eyebrow: "04 / THE ISLAND",
    title: "A new world. Many ways forward.",
    body: "You have reached an unfamiliar island. Wreckage lies scattered along the shore, a forest stretches inland, and a river cuts across your path. There is no instruction telling you what to do next. You must explore, experiment, and decide.",
    scene: "island",
    caption: "Your choices will shape the way forward."
  }
];

let root;
let onStartGame = () => {};
let assetsReady = false;
let introTimer = null;
let skipTimer = null;
let introStartedAt = 0;
let slideIndex = 0;
let introFinished = false;
let gameStarted = false;

const $ = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function button(label, className, handler) {
  const node = $("button", className, label);
  node.type = "button";
  node.addEventListener("click", handler);
  return node;
}

function clearIntroTimers() {
  if (introTimer) window.clearTimeout(introTimer);
  if (skipTimer) window.clearInterval(skipTimer);
  introTimer = null;
  skipTimer = null;
}

function showOpening() {
  clearIntroTimers();
  root.replaceChildren();
  root.className = "intro-screen opening-screen";
  introStartedAt = Date.now();

  const scene = $("div", "opening-cinema");
  scene.setAttribute("aria-label", "Animated cinematic of a ship crossing the sea, a storm, and an island appearing on the horizon");
  const horizon = $("div", "cinema-horizon");
  const sun = $("div", "cinema-sun");
  const sea = $("div", "cinema-sea");
  const ship = $("div", "cinema-ship");
  const shipSail = $("div", "cinema-sail");
  ship.append(shipSail);
  const storm = $("div", "cinema-storm");
  const island = $("div", "cinema-island");
  scene.append(horizon, sun, sea, island, ship, storm);

  const shade = $("div", "opening-shade");
  const copy = $("main", "opening-copy");
  copy.append(
    $("p", "intro-kicker", "AN ISLAND OF UNKNOWN POSSIBILITIES"),
    $("h1", "opening-title", "Every journey begins beyond the horizon."),
    $("p", "opening-subtitle", "A voyage. A storm. A world waiting to be discovered.")
  );
  const controls = $("div", "opening-controls");
  const skip = button("Skip intro  ·  10", "intro-button intro-button-secondary opening-skip", finishOpening);
  skip.disabled = true;
  skip.setAttribute("aria-label", "Skip intro becomes available after ten seconds");
  const progress = $("div", "opening-progress");
  progress.append($("span", "opening-progress-fill"));
  controls.append(skip, progress);
  root.append(scene, shade, copy, controls);

  logEvent("cinematic_intro_started", { durationMs: INTRO_DURATION_MS, skipUnlockMs: SKIP_UNLOCK_MS });
  let remaining = Math.ceil(SKIP_UNLOCK_MS / 1000);
  skipTimer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      window.clearInterval(skipTimer);
      skipTimer = null;
      skip.disabled = false;
      skip.textContent = "Skip intro  →";
      skip.setAttribute("aria-label", "Skip intro");
      logEvent("cinematic_intro_skip_unlocked", { elapsedMs: Date.now() - introStartedAt });
    } else {
      skip.textContent = `Skip intro  ·  ${remaining}`;
    }
  }, 1000);
  introTimer = window.setTimeout(() => finishOpening("completed"), INTRO_DURATION_MS);
}

function finishOpening(reason = "skipped") {
  if (introFinished) return;
  if (reason !== "completed" && Date.now() - introStartedAt < SKIP_UNLOCK_MS) return;
  introFinished = true;
  clearIntroTimers();
  logEvent("cinematic_intro_completed", { reason, elapsedMs: Date.now() - introStartedAt });
  slideIndex = 0;
  showStoryboard();
}

function makeIllustration(sceneName) {
  const art = $("div", `storyboard-art storyboard-art-${sceneName}`);
  art.setAttribute("role", "img");
  art.setAttribute("aria-label", `${sceneName} scene illustration`);
  const sky = $("div", "art-sky");
  const sun = $("div", "art-sun");
  const far = $("div", "art-land art-land-far");
  const near = $("div", "art-land art-land-near");
  const water = $("div", "art-water");
  const ship = $("div", "art-ship");
  const sail = $("div", "art-sail");
  ship.append(sail);
  const palms = $("div", "art-palms");
  art.append(sky, sun, far, near, water, ship, palms);
  return art;
}

function showStoryboard() {
  clearIntroTimers();
  root.replaceChildren();
  root.className = "intro-screen storyboard-screen";
  const slide = STORY_SLIDES[slideIndex];

  const top = $("header", "storyboard-topbar");
  top.append($("span", "intro-brand", "ISLAND OF CHOICES"), $("span", "storyboard-counter", `STORYBOARD  /  0${slideIndex + 1} — 0${STORY_SLIDES.length}`));

  const panel = $("main", "storyboard-panel");
  const visualWrap = $("section", "storyboard-visual-wrap");
  visualWrap.append(makeIllustration(slide.scene), $("p", "storyboard-caption", slide.caption));
  const copy = $("section", "storyboard-copy");
  copy.append($("p", "intro-kicker", slide.eyebrow), $("h1", "storyboard-title", slide.title), $("p", "storyboard-body", slide.body));
  const progress = $("div", "storyboard-dots");
  STORY_SLIDES.forEach((_, index) => {
    const dot = $("span", index === slideIndex ? "storyboard-dot is-active" : "storyboard-dot");
    dot.setAttribute("aria-label", `Slide ${index + 1}`);
    progress.append(dot);
  });
  copy.append(progress);
  panel.append(visualWrap, copy);

  const footer = $("footer", "storyboard-footer");
  const previous = button("← Previous", "intro-button intro-button-secondary", () => moveSlide(-1));
  previous.disabled = slideIndex === 0;
  const nextLabel = slideIndex === STORY_SLIDES.length - 1 ? "Continue to main menu  →" : "Next  →";
  footer.append(previous, $("span", "storyboard-hint", "Take a moment to discover how the journey begins."), button(nextLabel, "intro-button intro-button-primary", () => moveSlide(1)));
  root.append(top, panel, footer);
  logEvent("storyboard_slide_viewed", { slide: slideIndex + 1, scene: slide.scene });
}

function moveSlide(direction) {
  const next = slideIndex + direction;
  if (next < 0) return;
  if (next >= STORY_SLIDES.length) {
    logEvent("storyboard_completed", { slides: STORY_SLIDES.length });
    showLanding();
    return;
  }
  slideIndex = next;
  showStoryboard();
}

function showLanding() {
  clearIntroTimers();
  root.replaceChildren();
  root.className = "intro-screen landing-screen";

  const top = $("header", "intro-topbar");
  const brand = $("a", "intro-brand", "ISLAND OF CHOICES");
  brand.href = "#home";
  brand.addEventListener("click", (event) => event.preventDefault());
  const nav = $("nav", "intro-nav");
  nav.append(
    button("THE STORY", "intro-nav-button", () => { slideIndex = 0; showStoryboard(); }),
    button("HOW TO PLAY", "intro-nav-button", showHowToPlay),
    button("ABOUT", "intro-nav-button", showAbout)
  );
  top.append(brand, nav);

  const content = $("main", "landing-content");
  const title = $("h1", "landing-title");
  title.append($("span", "title-line", "Lost at sea."), $("span", "title-line title-line-accent", "Defined by choices."));
  const actions = $("div", "landing-actions");
  actions.append(button("Start / Play", "intro-button intro-button-primary", startGame));
  const status = $("p", "intro-status", assetsReady ? "The island is ready when you are." : "Preparing your world…");
  status.dataset.status = "assets";
  content.append($("p", "intro-kicker", "AN INTERACTIVE ADVENTURE"), title,
    $("p", "landing-subtitle", "One island. Countless possibilities. Every decision leaves a trace."), actions, status);

  const footer = $("footer", "intro-footer");
  footer.append($("span", "footer-note", "EXPLORE · EXPERIMENT · DISCOVER"), $("span", "footer-note", "A STORY ABOUT THE MANY WAYS FORWARD"));
  root.append(top, content, footer);
  logEvent("landing_opened", { version: "phase5.1", afterIntro: true });
}

function showHowToPlay() {
  root.replaceChildren();
  root.className = "intro-screen info-screen";
  const back = button("← BACK", "intro-back", showLanding);
  const panel = $("main", "info-panel");
  panel.append($("p", "intro-kicker", "HOW TO PLAY"), $("h1", "info-title", "Explore at your own pace."));
  const list = $("div", "controls-grid");
  [
    ["W A S D / ARROW KEYS", "Move around the island."],
    ["E / ENTER", "Interact with nearby objects and choose actions."],
    ["I", "Open or close your inventory."],
    ["J", "Open or close the Explorer Journal."],
    ["ESC", "Cancel an interaction or close a panel."],
    ["M / N", "Toggle the minimap / toggle sound."],
    ["P", "Demo tool: preview the live play-style analysis."],
    ["B / L", "Developer tools: toggle collision view / print event log."]
  ].forEach(([key, desc]) => {
    const row = $("div", "control-row");
    row.append($("kbd", "control-key", key), $("span", "control-desc", desc));
    list.append(row);
  });
  panel.append(list, button("Back to main menu", "intro-button intro-button-primary", showLanding));
  root.append(back, panel);
}

function showAbout() {
  root.replaceChildren();
  root.className = "intro-screen info-screen";
  const back = button("← BACK", "intro-back", showLanding);
  const panel = $("main", "info-panel");
  panel.append(
    $("p", "intro-kicker", "ABOUT THE PROJECT"),
    $("h1", "info-title", "There is more than one way forward."),
    $("p", "info-copy", "Island of Choices explores open-ended problem solving. Players are free to try different strategies, learn from unsuccessful attempts, and adapt their approach."),
    $("p", "info-copy", "The journey records meaningful actions and outcomes so that a later reflection can describe a player's approach using evidence—not assumptions or a single score."),
    button("Back to main menu", "intro-button intro-button-primary", showLanding)
  );
  root.append(back, panel);
}

function startGame() {
  if (gameStarted || !assetsReady) return;
  gameStarted = true;
  logEvent("game_started_from_landing", { introCompleted: introFinished, storyboardSlides: STORY_SLIDES.length });
  onStartGame({ priorLog: [...gameState.log], startedAt: gameState.startedAt });
}

export function mountIntro({ startGame: startGameCallback }) {
  root = document.getElementById("intro-root");
  onStartGame = startGameCallback;
  logEvent("experience_opened", { version: "phase5.1" });
  showOpening();

  if (window.__iocAssetsReady) assetsReady = true;
  window.addEventListener("ioc:assets-ready", () => {
    assetsReady = true;
    const status = root?.querySelector('[data-status="assets"]');
    if (status) status.textContent = "The island is ready when you are.";
    const start = root?.querySelector(".landing-actions button");
    if (start) {
      start.disabled = false;
      start.textContent = "Start / Play";
    }
  });
}
