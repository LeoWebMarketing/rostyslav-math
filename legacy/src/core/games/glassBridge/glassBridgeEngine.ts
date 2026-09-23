import type { GlassPanel, GlassBridgeState, GlassBridgeProblem } from '@core/types';

/**
 * Game configuration
 */
export const BRIDGE_CONFIG = {
  DEFAULT_ROWS: 6,      // Default number of steps
  MIN_ROWS: 4,          // Minimum steps (easy)
  MAX_ROWS: 10,         // Maximum steps (hard)
};

/**
 * Generate a simple math problem
 */
function generateProblem(): GlassBridgeProblem {
  const op = Math.random() < 0.5 ? '+' : '-';
  let a: number, b: number, answer: number, wrongAnswer: number;

  if (op === '+') {
    // Addition: result 5-18
    a = Math.floor(Math.random() * 10) + 3; // 3-12
    b = Math.floor(Math.random() * 8) + 2;  // 2-9
    answer = a + b;
  } else {
    // Subtraction: result 1-15
    a = Math.floor(Math.random() * 10) + 8; // 8-17
    b = Math.floor(Math.random() * 7) + 2;  // 2-8
    answer = a - b;
  }

  // Generate a wrong answer (close to correct, but different)
  const offset = Math.random() < 0.5 ? 1 : -1;
  const wrongOffset = Math.floor(Math.random() * 3) + 1; // 1-3 difference
  wrongAnswer = answer + (offset * wrongOffset);

  // Make sure wrong answer is positive and different from correct
  if (wrongAnswer <= 0 || wrongAnswer === answer) {
    wrongAnswer = answer + wrongOffset;
  }

  return { a, b, op, answer, wrongAnswer };
}

/**
 * Create a new glass bridge with math problems
 */
export function createGlassBridge(totalRows: number = BRIDGE_CONFIG.DEFAULT_ROWS): GlassBridgeState {
  const panels: GlassPanel[] = [];
  const problems: GlassBridgeProblem[] = [];

  for (let row = 0; row < totalRows; row++) {
    const problem = generateProblem();
    problems.push(problem);

    // Randomly place correct answer on left (0) or right (1)
    const correctCol = Math.random() < 0.5 ? 0 : 1;

    // Create left panel
    panels.push({
      id: row * 2,
      row,
      col: 0,
      isSafe: correctCol === 0,
      isRevealed: false,
      isBroken: false,
      displayValue: correctCol === 0 ? problem.answer : problem.wrongAnswer,
    });

    // Create right panel
    panels.push({
      id: row * 2 + 1,
      row,
      col: 1,
      isSafe: correctCol === 1,
      isRevealed: false,
      isBroken: false,
      displayValue: correctCol === 1 ? problem.answer : problem.wrongAnswer,
    });
  }

  return {
    panels,
    problems,
    currentRow: -1, // Start before the bridge
    totalRows,
    completed: false,
    failed: false,
    selectedPanel: null,
  };
}

/**
 * Get panels for a specific row
 */
export function getPanelsForRow(state: GlassBridgeState, row: number): [GlassPanel, GlassPanel] {
  const left = state.panels.find(p => p.row === row && p.col === 0)!;
  const right = state.panels.find(p => p.row === row && p.col === 1)!;
  return [left, right];
}

/**
 * Get problem for a specific row
 */
export function getProblemForRow(state: GlassBridgeState, row: number): GlassBridgeProblem {
  return state.problems[row];
}

/**
 * Step on a panel and return the result
 */
export function stepOnPanel(
  state: GlassBridgeState,
  panelId: number
): { success: boolean; newState: GlassBridgeState } {
  const panel = state.panels.find(p => p.id === panelId);

  if (!panel || panel.row !== state.currentRow + 1) {
    // Can only step on the next row
    return { success: false, newState: state };
  }

  const newPanels = state.panels.map(p => {
    if (p.id === panelId) {
      return {
        ...p,
        isRevealed: true,
        isBroken: !p.isSafe,
      };
    }
    // Also reveal the other panel in the same row
    if (p.row === panel.row && p.id !== panelId) {
      return {
        ...p,
        isRevealed: true,
      };
    }
    return p;
  });

  if (panel.isSafe) {
    // Successful step
    const newRow = state.currentRow + 1;
    const completed = newRow >= state.totalRows - 1;

    return {
      success: true,
      newState: {
        ...state,
        panels: newPanels,
        currentRow: newRow,
        completed,
        selectedPanel: panelId,
      },
    };
  } else {
    // Fell through!
    return {
      success: false,
      newState: {
        ...state,
        panels: newPanels,
        failed: true,
        selectedPanel: panelId,
      },
    };
  }
}

/**
 * Get progress percentage
 */
export function getBridgeProgress(state: GlassBridgeState): number {
  if (state.currentRow < 0) return 0;
  return Math.round(((state.currentRow + 1) / state.totalRows) * 100);
}

/**
 * Get result message
 */
export function getGlassBridgeResult(state: GlassBridgeState): {
  emoji: string;
  title: string;
  message: string;
} {
  if (state.completed) {
    return {
      emoji: '🏆',
      title: 'Перемога!',
      message: `Ти перейшов міст за ${state.currentRow + 1} кроків!`,
    };
  }

  return {
    emoji: '💔',
    title: 'Впав!',
    message: `Ти дійшов до кроку ${state.currentRow + 2} з ${state.totalRows}`,
  };
}
