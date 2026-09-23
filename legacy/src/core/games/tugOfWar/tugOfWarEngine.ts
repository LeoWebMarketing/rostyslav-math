import type { TugOfWarProblem, TugOfWarState } from '@core/types';

export function generateTugProblem(): TugOfWarProblem {
  const op = Math.random() > 0.5 ? '+' : '-';
  let a: number, b: number, answer: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 10) + 1; // 1-10
    b = Math.floor(Math.random() * 10) + 1; // 1-10
    answer = a + b;
  } else {
    a = Math.floor(Math.random() * 10) + 10; // 10-19
    b = Math.floor(Math.random() * a) + 1; // 1 to a
    answer = a - b;
  }

  // Generate 3 options
  const options = new Set<number>([answer]);
  while (options.size < 3) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const wrong = Math.random() > 0.5 ? answer + offset : Math.max(1, answer - offset);
    if (wrong > 0 && wrong !== answer) {
      options.add(wrong);
    }
  }

  return {
    a,
    b,
    op,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

export function generateTugProblems(count: number = 20): TugOfWarProblem[] {
  return Array.from({ length: count }, () => generateTugProblem());
}

export function createTugOfWarState(): TugOfWarState {
  return {
    ropePosition: 50,
    problems: generateTugProblems(),
    currentProblemIndex: 0,
    completed: false,
    failed: false,
    isAnswering: false,
  };
}

export function calculateRopeMove(
  currentPosition: number,
  isCorrect: boolean
): { newPosition: number; completed: boolean; failed: boolean } {
  const move = isCorrect ? 10 : -10;
  const newPosition = Math.max(0, Math.min(100, currentPosition + move));

  return {
    newPosition,
    completed: newPosition >= 100,
    failed: newPosition <= 0,
  };
}
