let currentGameState;
let currentScreen = "menu";

function initializeGame() {
  const savedState = loadGame();

  if (savedState) {
    currentGameState = savedState;
  } else {
    currentGameState = createDefaultState();
  }

  renderCurrentScreen();
}

function renderCurrentScreen() {
  renderScreen(currentScreen, loadGame() !== null);
}

function setScreen(screenName) {
  currentScreen = screenName;
  renderCurrentScreen();
}

function toggleJournal() {
  const journal = document.getElementById("journal-panel");
  const trigger = document.querySelector("[data-action='toggle-journal']");
  if (!journal) return;
  const willOpen = journal.hidden;
  journal.hidden = !willOpen;
  if (trigger) trigger.setAttribute("aria-expanded", String(willOpen));
}

function takeRest() {
  const state = currentGameState;
  if (!state || state.player.time < 10 || isGameOver(state)) return;
  const recovered = Math.min(25, 100 - state.player.energy);
  state.player.energy += recovered;
  state.player.time = Math.max(0, state.player.time - 10);
  state.player.restsTaken += 1;
  state.lastResult = {
    title: "Kamu beristirahat",
    text: recovered ? `Energi pulih ${recovered}%, tetapi waktu berkurang 10%.` : "Energi sudah penuh, tetapi waktu tetap berlalu.",
    success: true
  };
  saveGame(state);
  renderCurrentScreen();
}

function handleAppClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;

  if (!action) {
    return;
  }

  if (action === "new-game") {
    currentGameState = createDefaultState();
    saveGame(currentGameState);
    setScreen("introduction");
  }

  if (action === "continue") {
    currentGameState = loadGame();
    setScreen("gameplay");
  }

  if (action === "start-gameplay") {
    saveGame(currentGameState);
    setScreen("gameplay");
  }

  if (action === "back-menu") {
    setScreen("menu");
  }

  if (action === "travel") {
    currentGameState.player.currentLocation = event.target.closest("[data-location]").dataset.location;
    currentGameState.world.locations[currentGameState.player.currentLocation].visited = true;
    currentGameState.lastResult = null;
    saveGame(currentGameState); renderCurrentScreen();
  }

  if (action === "problem-choice") applyProblemChoice(event.target.closest("[data-problem]").dataset.problem, event.target.closest("[data-choice]").dataset.choice);
  if (action === "signal-step") submitSignalStep(event.target.closest("[data-step]").dataset.step);
  if (action === "finish-game") setScreen("ending");
  if (action === "show-analysis") setScreen("analysis");
  if (action === "back-ending") setScreen("ending");
  if (action === "how-to-play") setScreen("how-to-play");
  if (action === "close-guide") setScreen("menu");
  if (action === "toggle-journal") toggleJournal();
  if (action === "rest") takeRest();
  if (action === "reset-save") {
    resetGame();
    currentGameState = createDefaultState();
    setScreen("menu");
  }
}

function bootApp() {
  initializeGame();
  const app = document.getElementById("app");
  app.addEventListener("click", handleAppClick);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const journal = document.getElementById("journal-panel");
      if (journal && !journal.hidden) toggleJournal();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootApp, { once: true });
} else {
  bootApp();
}
