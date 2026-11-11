const CURRENT_SAVE_VERSION = 2;
const SAVE_KEY = "islandOfChoices_save";

function createDefaultState() {
  return {
    player: {
      energy: 100,
      time: 100,
      currentLocation: "beach",
      inventory: [],
      restsTaken: 0
    },
    world: {
      locations: {
        beach: { unlocked: true, visited: false },
        forest: { unlocked: false, visited: false },
        hub: { unlocked: false, visited: false },
        signal_point: { unlocked: false, visited: false }
      },
      cluesFound: []
    },
    problems: {
      river: { status: "not_started", strategyUsed: null, attempts: 0 },
      locked_station: {
        status: "not_started",
        strategyUsed: null,
        attempts: 0,
        deviceCondition: null
      },
      signal_tower: {
        status: "not_started",
        attempts: 0,
        sequenceAttempts: []
      }
    },
    decisionHistory: [],
    lastResult: null
  };
}

function saveGame(state) {
  const saveData = {
    version: CURRENT_SAVE_VERSION,
    state: state
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const savedData = localStorage.getItem(SAVE_KEY);

  if (!savedData) {
    return null;
  }

  try {
    const parsedData = JSON.parse(savedData);

    if (!parsedData.state) {
      return null;
    }
    return normalizeState(parsedData.state);
  } catch (error) {
    console.warn("Save game tidak dapat dibaca.", error);
    return null;
  }
}

function normalizeState(state) {
  const defaults = createDefaultState();
  state.player = { ...defaults.player, ...state.player };
  state.world = { ...defaults.world, ...state.world, locations: { ...defaults.world.locations, ...state.world?.locations } };
  state.problems = {
    ...defaults.problems,
    ...state.problems,
    river: { ...defaults.problems.river, ...state.problems?.river },
    locked_station: { ...defaults.problems.locked_station, ...state.problems?.locked_station },
    signal_tower: { ...defaults.problems.signal_tower, ...state.problems?.signal_tower }
  };
  state.problems.signal_tower.sequenceAttempts ||= [];
  state.decisionHistory ||= [];
  state.lastResult ||= null;
  return state;
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
}

function isGameOver(state) {
  return state.player.energy <= 0 || state.player.time <= 0;
}
