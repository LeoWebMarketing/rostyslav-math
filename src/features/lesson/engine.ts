import type { Exercise, Lesson } from '../../../content/schema';
import { checkAnswer } from '../../lib/normalization';

export type Answer = string | string[] | number[];
export type Attempt = { exerciseId: string; correct: boolean; answer: string };
export type LessonState = {
  queue: Exercise[];
  total: number;
  solved: string[];
  firstTryCorrect: number;
  attempted: string[];
  attempts: Attempt[];
  phase: 'answer' | 'feedback' | 'complete';
  lastCorrect: boolean | null;
};

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function startLesson(lesson: Lesson, random: () => number = Math.random): LessonState {
  return {
    queue: shuffle(lesson.exercises, random),
    total: lesson.exercises.length,
    solved: [],
    firstTryCorrect: 0,
    attempted: [],
    attempts: [],
    phase: lesson.exercises.length ? 'answer' : 'complete',
    lastCorrect: null,
  };
}

export function isAnswerReady(exercise: Exercise, answer: Answer): boolean {
  if (exercise.type === 'match') return Array.isArray(answer)
    && answer.length === exercise.pairs.length
    && answer.every(value => typeof value === 'number' && value >= 0);
  if (exercise.type === 'order') return Array.isArray(answer) && answer.length > 0;
  if (exercise.type === 'math') return typeof answer === 'string' && answer.trim() !== '' && Number.isFinite(Number(answer));
  return typeof answer === 'string' && answer.trim().length > 0;
}

export function checkExercise(exercise: Exercise, answer: Answer): boolean {
  if (exercise.type === 'choice') return typeof answer === 'string' && answer === exercise.answer;
  if (exercise.type === 'match') return Array.isArray(answer)
    && answer.length === exercise.pairs.length
    && new Set(answer as number[]).size === answer.length
    && answer.every((value, index) => typeof value === 'number' && exercise.pairs[value]?.[1] === exercise.pairs[index][1]);
  if (exercise.type === 'type') return typeof answer === 'string'
    && checkAnswer(answer, [exercise.answer, ...(exercise.accept ?? [])], exercise.typoTolerance);
  if (exercise.type === 'order') return Array.isArray(answer)
    && [exercise.answer, ...(exercise.accept ?? [])].some(
      expected => expected.length === answer.length && expected.every((token, index) => token === answer[index]),
    );
  if (exercise.type === 'fill') return typeof answer === 'string' && checkAnswer(answer, [exercise.answer, ...(exercise.accept ?? [])]);
  if (exercise.type === 'math') return typeof answer === 'string' && answer.trim() !== '' && Number(answer) === exercise.answer;
  return false;
}

export function submitAnswer(state: LessonState, answer: Answer): LessonState {
  if (state.phase !== 'answer' || !state.queue.length || !isAnswerReady(state.queue[0], answer)) return state;
  const exercise = state.queue[0];
  const correct = checkExercise(exercise, answer);
  return {
    ...state,
    phase: 'feedback',
    lastCorrect: correct,
    firstTryCorrect: state.firstTryCorrect + (correct && !state.attempted.includes(exercise.id) ? 1 : 0),
    attempted: state.attempted.includes(exercise.id) ? state.attempted : [...state.attempted, exercise.id],
    attempts: [...state.attempts, { exerciseId: exercise.id, correct, answer: Array.isArray(answer) ? answer.join(' ') : answer }],
  };
}

export function submitWrongPair(state: LessonState, left: number, right: number): LessonState {
  if (state.phase !== 'answer' || state.queue[0]?.type !== 'match') return state;
  const exercise = state.queue[0];
  return { ...state, phase: 'feedback', lastCorrect: false,
    attempted: state.attempted.includes(exercise.id) ? state.attempted : [...state.attempted, exercise.id],
    attempts: [...state.attempts, { exerciseId: exercise.id, correct: false, answer: `${left}:${right}` }],
  };
}

export function continueLesson(state: LessonState): LessonState {
  if (state.phase !== 'feedback') return state;
  const [current, ...rest] = state.queue;
  const solved = state.lastCorrect ? [...state.solved, current.id] : state.solved;
  const queue = state.lastCorrect ? rest : [...rest, current];
  return { ...state, queue, solved, phase: queue.length ? 'answer' : 'complete', lastCorrect: null };
}

export function lessonResult(state: LessonState) {
  const accuracy = state.total ? state.firstTryCorrect / state.total : 0;
  return { accuracy, stars: accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1, xp: 10 + 2 * state.firstTryCorrect };
}

export function correctAnswer(exercise: Exercise): string {
  if (exercise.type === 'match') return exercise.pairs.map(([left, right]) => `${left} — ${right}`).join(', ');
  if (exercise.type === 'order') return exercise.answer.join(' ');
  return String(exercise.answer);
}
