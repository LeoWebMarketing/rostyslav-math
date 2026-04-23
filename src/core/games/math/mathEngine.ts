import type { MathProblem, MathStep } from '@core/types';

/**
 * Generate a single math problem.
 * 30% pure multiplication:  a × b = ?  (a,b ∈ [1..4])
 * 70% two-action:           X ± Y×Z  or  Y×Z ± X
 *   Y,Z ∈ [1..4], X ∈ [1..15], result ∈ [0..30]
 */
export function generateProblem(): MathProblem {
  let attempts = 0;

  do {
    attempts++;

    if (Math.random() < 0.30) {
      // --- pure multiplication ---
      const a = Math.floor(Math.random() * 4) + 1;  // 1-4
      const b = Math.floor(Math.random() * 4) + 1;  // 1-4
      return {
        a,
        b,
        c: 0,
        op1: '*',
        op2: null,
        answer: a * b,
        display: `${a} × ${b} = ?`
      };
    }

    // --- two-action: one multiplication + one +/- ---
    const addSubOp = Math.random() < 0.5 ? '+' : '-';
    const y = Math.floor(Math.random() * 4) + 1;  // 1-4
    const z = Math.floor(Math.random() * 4) + 1;  // 1-4
    const x = Math.floor(Math.random() * 15) + 1; // 1-15
    const product = y * z;

    if (Math.random() < 0.5) {
      // form: X op Y×Z   →  a=X, op1=addSubOp, b=Y, op2='*', c=Z
      const result = addSubOp === '+' ? x + product : x - product;
      if (result < 0 || result > 30) continue;
      return {
        a: x,
        b: y,
        c: z,
        op1: addSubOp,
        op2: '*',
        answer: result,
        display: `${x} ${addSubOp} ${y} × ${z} = ?`
      };
    } else {
      // form: Y×Z op X   →  a=Y, op1='*', b=Z, op2=addSubOp, c=X
      const result = addSubOp === '+' ? product + x : product - x;
      if (result < 0 || result > 30) continue;
      return {
        a: y,
        b: z,
        c: x,
        op1: '*',
        op2: addSubOp,
        answer: result,
        display: `${y} × ${z} ${addSubOp} ${x} = ?`
      };
    }
  } while (attempts < 100);

  // fallback: simple 2×2
  return { a: 2, b: 2, c: 0, op1: '*', op2: null, answer: 4, display: '2 × 2 = ?' };
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
