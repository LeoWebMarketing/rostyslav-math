export type DinoId = 'raptor' | 'triceratops' | 'trex' | 'stegosaurus' | 'pterodactyl';

export const DINOSAURS: Record<DinoId, { name: string; speed: number; walls: number }> = {
  raptor: { name: 'Раптор', speed: 1.35, walls: 4 },
  triceratops: { name: 'Трицератопс', speed: 1, walls: 5 },
  trex: { name: 'Тиранозавр', speed: 1, walls: 5 },
  stegosaurus: { name: 'Стегозавр', speed: 0.9, walls: 5 },
  pterodactyl: { name: 'Птеродактиль', speed: 1, walls: 5 },
};

export type GamePhase = 'running' | 'question' | 'feedback' | 'paused' | 'escaped' | 'caught';
export type RunnerPose = 'run' | 'jump' | 'duck';

export interface PendingRetry {
  questionId: string;
  /** The number of cleared walls before this card is eligible again. */
  dueAt: number;
}

export interface GameState {
  dino: DinoId;
  phase: GamePhase;
  pausedFrom: Exclude<GamePhase, 'paused' | 'escaped' | 'caught'> | null;
  elapsedMs: number;
  pose: RunnerPose;
  poseRemainingMs: number;
  distanceSteps: number;
  wallsCleared: number;
  targetWalls: number;
  rubies: number;
  currentQuestionId: string | null;
  lastAnswerCorrect: boolean | null;
  pendingRetries: PendingRetry[];
}

export type GameAction =
  | { type: 'tick'; deltaMs: number }
  | { type: 'jump' }
  | { type: 'duck' }
  | { type: 'hit' }
  | { type: 'ruby' }
  | { type: 'wall'; questionId: string }
  | { type: 'answer'; correct: boolean }
  | { type: 'continue' }
  | { type: 'escape' }
  | { type: 'caught' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'restart' };

export function createGameState(dino: DinoId): GameState {
  return {
    dino,
    phase: 'running',
    pausedFrom: null,
    elapsedMs: 0,
    pose: 'run',
    poseRemainingMs: 0,
    distanceSteps: 0,
    wallsCleared: 0,
    targetWalls: DINOSAURS[dino].walls,
    rubies: 0,
    currentQuestionId: null,
    lastAnswerCorrect: null,
    pendingRetries: [],
  };
}

/** Ask for this card before drawing a fresh card for the next wall. */
export function dueRetryQuestionId(state: GameState): string | null {
  return state.pendingRetries.find(retry => retry.dueAt <= state.wallsCleared)?.questionId ?? null;
}

function approach(state: GameState): GameState {
  const distanceSteps = Math.min(3, state.distanceSteps + 1);
  return { ...state, distanceSteps, phase: distanceSteps === 3 ? 'caught' : state.phase };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick': {
      if (state.phase !== 'running' || !Number.isFinite(action.deltaMs) || action.deltaMs <= 0) return state;
      const poseRemainingMs = Math.max(0, state.poseRemainingMs - action.deltaMs);
      return {
        ...state,
        elapsedMs: state.elapsedMs + action.deltaMs,
        poseRemainingMs,
        pose: poseRemainingMs === 0 ? 'run' : state.pose,
      };
    }
    case 'jump':
      return state.phase === 'running'
        ? { ...state, pose: 'jump', poseRemainingMs: 700 }
        : state;
    case 'duck':
      return state.phase === 'running'
        ? { ...state, pose: 'duck', poseRemainingMs: 800 }
        : state;
    case 'hit':
      return state.phase === 'running' ? approach(state) : state;
    case 'ruby':
      return state.phase === 'running' ? { ...state, rubies: state.rubies + 1 } : state;
    case 'wall':
      if (state.phase !== 'running' || !action.questionId.trim()
        || (state.wallsCleared >= state.targetWalls && state.pendingRetries.length === 0)) return state;
      return {
        ...state,
        phase: 'question',
        pose: 'run',
        poseRemainingMs: 0,
        currentQuestionId: action.questionId,
        lastAnswerCorrect: null,
        pendingRetries: state.pendingRetries.filter(retry => retry.questionId !== action.questionId),
      };
    case 'answer': {
      if (state.phase !== 'question' || !state.currentQuestionId) return state;
      const answered: GameState = {
        ...state,
        phase: 'feedback',
        lastAnswerCorrect: action.correct,
        rubies: state.rubies + (action.correct ? 3 : 0),
      };
      if (action.correct) return answered;
      // Keep feedback visible even at the third step, so the child can read the correction.
      return { ...answered, distanceSteps: Math.min(3, answered.distanceSteps + 1) };
    }
    case 'continue': {
      if (state.phase !== 'feedback' || !state.currentQuestionId) return state;
      if (state.distanceSteps === 3) return { ...state, phase: 'caught' };
      const wallsCleared = state.wallsCleared + 1;
      const pendingRetries = state.lastAnswerCorrect === false
        ? [...state.pendingRetries, { questionId: state.currentQuestionId, dueAt: wallsCleared + 2 }]
        : state.pendingRetries;
      return {
        ...state,
        phase: 'running',
        wallsCleared,
        currentQuestionId: null,
        lastAnswerCorrect: null,
        pendingRetries,
      };
    }
    case 'escape':
      return state.phase === 'running' && state.wallsCleared >= state.targetWalls && state.pendingRetries.length === 0
        ? { ...state, phase: 'escaped', rubies: state.rubies + 10 }
        : state;
    case 'caught':
      return state.phase === 'running' ? { ...state, phase: 'caught', distanceSteps: 3 } : state;
    case 'pause':
      return state.phase === 'running' || state.phase === 'question' || state.phase === 'feedback'
        ? { ...state, pausedFrom: state.phase, phase: 'paused' }
        : state;
    case 'resume':
      return state.phase === 'paused' && state.pausedFrom
        ? { ...state, phase: state.pausedFrom, pausedFrom: null }
        : state;
    case 'restart':
      return createGameState(state.dino);
  }
}
