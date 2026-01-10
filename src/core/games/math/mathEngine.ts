import type { MathProblem, MathStep } from '@core/types';

/**
 * Generate a single math problem
 * Format: A op1 B op2 C = ?
 * Result is always between 0 and 20
 */
export function generateProblem(): MathProblem {
  const types: Array<{ ops: ['+' | '-', '+' | '-'] }> = [
    { ops: ['+', '+'] },
    { ops: ['+', '-'] },
    { ops: ['-', '+'] },
    { ops: ['-', '-'] }
  ];

  const type = types[Math.floor(Math.random() * types.length)];
  let a: number, b: number, c: number, result: number;
  let attempts = 0;

  do {
    a = Math.floor(Math.random() * 15) + 3;  // 3-17
    b = Math.floor(Math.random() * 9) + 1;   // 1-9
    c = Math.floor(Math.random() * 9) + 1;   // 1-9

    result = a;
    result = type.ops[0] === '+' ? result + b : result - b;
    result = type.ops[1] === '+' ? result + c : result - c;

    attempts++;
  } while ((result < 0 || result > 20 || (a - b < 0 && type.ops[0] === '-')) && attempts < 100);

  return {
    a,
    b,
    c,
    op1: type.ops[0],
    op2: type.ops[1],
    answer: result,
    display: `${a} ${type.ops[0]} ${b} ${type.ops[1]} ${c} = ?`
  };
}

/**
 * Generate a session of problems
 */
export function generateSession(count: number = 10): MathProblem[] {
  return Array.from({ length: count }, () => generateProblem());
}

/**
 * Validate user's answer
 */
export function validateAnswer(problem: MathProblem, answer: number): boolean {
  return problem.answer === answer;
}

/**
 * Validate a decomposition step
 */
export function validateStep(step: MathStep): boolean {
  if (step.num1 === null || step.num2 === null || step.result === null) {
    return false;
  }

  const expected = step.operator === '+'
    ? step.num1 + step.num2
    : step.num1 - step.num2;

  return expected === step.result;
}

/**
 * Get stars based on score
 */
export function getStars(correct: number, total: number = 10): number {
  if (correct >= total) return 3;
  if (correct >= total * 0.8) return 2;
  if (correct >= total * 0.5) return 1;
  return 0;
}

/**
 * Get result message based on score
 */
export function getResultMessage(correct: number, total: number = 10): { icon: string; title: string } {
  if (correct >= total) return { icon: '🏆', title: 'Ідеально!' };
  if (correct >= total * 0.8) return { icon: '🎉', title: 'Чудово!' };
  if (correct >= total * 0.5) return { icon: '👍', title: 'Добре!' };
  return { icon: '💪', title: 'Спробуй ще!' };
}
