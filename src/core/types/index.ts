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

// ==================== GAME STATE TYPES ====================

export type Screen = 'start' | 'math' | 'mathResult' | 'dalgona' | 'dalgonaResult';

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
