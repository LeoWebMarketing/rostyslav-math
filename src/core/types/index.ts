// ==================== MATH GAME TYPES ====================

export interface MathProblem {
  a: number;
  b: number;
  c: number;
  op1: '+' | '-';
  op2: '+' | '-';
  answer: number;
  display: string;
}

export interface MathStep {
  num1: number | null;
  num2: number | null;
  operator: '+' | '-';
  result: number | null;
  isValid: boolean | null;
}

// ==================== DALGONA GAME TYPES ====================

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  name: string;
  icon: string;
  difficulty: 1 | 2 | 3;
  getPath: (cx: number, cy: number, r: number) => Point[];
}

export interface PathCheck {
  onPath: boolean;
  distance: number;
  index: number;
}

export interface DalgonaState {
  shape: Shape | null;
  path: Point[];
  traced: Point[];
  lives: number;
  progress: number;
  isDrawing: boolean;
  currentIndex: number;
  completed: boolean;
  failed: boolean;
  tolerance: number;
}

// ==================== RED LIGHT GREEN LIGHT TYPES ====================

export type LightState = 'green' | 'red' | 'countdown';

export interface RedLightState {
  position: number;         // Player position (0-100)
  light: LightState;        // Current light state
  isMoving: boolean;        // Is player currently moving
  timeLeft: number;         // Time remaining in seconds
  gameStarted: boolean;     // Has game started
  completed: boolean;       // Reached finish
  failed: boolean;          // Caught moving on red
  countdown: number;        // 3-2-1 countdown
}

// ==================== GLASS BRIDGE TYPES ====================

export interface GlassPanel {
  id: number;
  row: number;
  col: 0 | 1;           // Left or right
  isSafe: boolean;      // Tempered glass = safe (correct answer)
  isRevealed: boolean;  // Has been stepped on
  isBroken: boolean;    // Broken (fell through)
  displayValue: number; // Number shown on panel
}

export interface GlassBridgeProblem {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;       // Correct answer
  wrongAnswer: number;  // Wrong answer to show
}

export interface GlassBridgeState {
  panels: GlassPanel[];
  problems: GlassBridgeProblem[];  // Math problem for each row
  currentRow: number;   // Player's current position (-1 = start)
  totalRows: number;    // Total steps to cross
  completed: boolean;
  failed: boolean;
  selectedPanel: number | null; // Currently selected panel ID
}

// ==================== GAME STATE TYPES ====================

export type Screen = 'start' | 'math' | 'mathResult' | 'dalgona' | 'dalgonaResult' | 'redLight' | 'redLightResult' | 'glassBridge' | 'glassBridgeResult' | 'tugOfWar' | 'tugOfWarResult' | 'marbles' | 'marblesResult' | 'zuma' | 'zumaResult';

// ==================== TUG OF WAR TYPES ====================

export interface TugOfWarProblem {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
  options: number[];
}

export interface TugOfWarState {
  ropePosition: number;
  problems: TugOfWarProblem[];
  currentProblemIndex: number;
  completed: boolean;
  failed: boolean;
  isAnswering: boolean;
}

// ==================== MARBLES GAME TYPES ====================

export interface MarblesProblem {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
  isOdd: boolean;
  options: number[];
}

export type MarblesPhase = 'bet' | 'guess' | 'solve' | 'result';

export interface MarblesState {
  playerMarbles: number;
  opponentMarbles: number;
  currentBet: number;
  playerGuess: 'odd' | 'even' | null;
  problem: MarblesProblem | null;
  phase: MarblesPhase;
  roundResult: 'win' | 'lose' | null;
  completed: boolean;
  failed: boolean;
}

// ==================== ZUMA MATH TYPES ====================

export interface ZumaBall {
  id: number;
  value: number;
  position: number; // 0-1 along path
  isMatched: boolean;
  isRemoving: boolean;
}

export interface ZumaShooter {
  angle: number; // radians
  currentBall: number; // value of ball to shoot
  nextBall: number; // preview of next ball
}

export interface ZumaState {
  balls: ZumaBall[];
  shooter: ZumaShooter;
  targetSum: number;
  score: number;
  level: number;
  speed: number; // balls per second movement
  completed: boolean;
  failed: boolean;
  isPaused: boolean;
  comboCount: number;
  lastMatchTime: number;
}

export interface GameStats {
  date: string;
  sessions: number;
  correct: number;
  best: number;
}

export interface DalgonaStats {
  completed: string[];
}

// ==================== STORAGE TYPES ====================

export interface StorageAdapter {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
}
