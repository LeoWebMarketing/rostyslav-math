import type { Exercise, Section } from '../../../content/schema';
import { extractLatinSegments } from '../lesson/speech';

export type GameQuestion = {
  id: string;
  exerciseId: string;
  reviewKey: string;
  prompt: string;
  options: [string, string, string];
  answer: string;
  explain?: string;
  speak: boolean;
  source: 'current' | 'mistake' | 'top-up';
  mistakeKey?: string;
};

export type QuestionPoolInput = {
  sections: readonly Section[];
  grade: number;
  subject: string;
  section: string;
  mistakes: readonly string[];
  count?: number;
  previousId?: string;
  random?: () => number;
};

type LocatedExercise = { exercise: Exercise; section: Section; lessonId: string };
type Candidate = Omit<GameQuestion, 'options' | 'source'> & { options: string[] };

export const normalizeAnswer = (value: string): string => value.trim().normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase();

export function questionSpeechText(question: Pick<GameQuestion, 'answer' | 'prompt'>): string | null {
  const answer = extractLatinSegments(question.answer);
  if (answer.length) return answer.join('. ');
  const prompt = extractLatinSegments(question.prompt);
  return prompt.length ? prompt.join('. ') : null;
}

function answerShape(value: string): string {
  const words = value.trim().split(/\s+/);
  const plain = words.join('').replace(/[^\p{L}\p{N}]/gu, '');
  const script = /[\u0400-\u04ff]/u.test(plain) ? 'cyrillic' : /[A-Za-z]/.test(plain) ? 'latin' : 'none';
  const kind = /^\d+$/.test(plain) ? 'number' : /\d/.test(plain) ? 'mixed' : 'letters';
  const punctuation = /[,.!?]$/.test(value.trim()) ? 'punctuated' : 'plain';
  return `${script}:${kind}:${words.length}:${plain.length === 1 ? 'letter' : 'word'}:${punctuation}`;
}

function answerWords(exercise: Exercise): string[] {
  if (exercise.type === 'learn' || exercise.type === 'math') return [];
  if (exercise.type === 'match') return exercise.pairs.flat();
  if (exercise.type === 'order') return exercise.answer;
  if (exercise.type === 'choice') return exercise.options;
  return [exercise.answer];
}

function distractorsFor(located: LocatedExercise): string[] {
  const { section, lessonId, exercise } = located;
  const lesson = section.lessons.find(item => item.id === lessonId);
  if (!lesson || !('answer' in exercise) || typeof exercise.answer !== 'string') return [];
  const answer = exercise.answer;
  const shape = answerShape(answer);
  const sameLesson = lesson.exercises.filter(item => item.id !== exercise.id);
  const preferred = exercise.type === 'fill'
    ? ['fill', 'order', 'choice', 'match', 'type', 'learn']
    : ['type', 'match', 'choice', 'order', 'fill', 'learn'];
  sameLesson.sort((left, right) => preferred.indexOf(left.type) - preferred.indexOf(right.type));
  const candidates = [
    ...sameLesson,
    ...section.lessons.filter(item => item.id !== lessonId).flatMap(item => item.exercises.filter(other => other.type === exercise.type)),
    ...section.lessons.filter(item => item.id !== lessonId).flatMap(item => item.exercises.filter(other => other.type !== exercise.type)),
  ];
  return distinct(candidates.flatMap(answerWords).filter(value => answerShape(value) === shape && normalizeAnswer(value) !== normalizeAnswer(answer)));
}

function matchPrompt(left: string, right: string): string {
  if (/^\d+$/.test(left.trim()) && /[\p{L}]/u.test(right)) return `Як записати число ${left} словами?`;
  if (/[\u0400-\u04ff]/u.test(left) && /[A-Za-z]/.test(right)) return `Як сказати англійською «${left}»?`;
  return `Що означає «${left}»?`;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function distinct(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => {
    const key = normalizeAnswer(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shortAnswer(answer: string): boolean {
  return answer.trim().length <= 32 && answer.trim().split(/\s+/).length <= 3;
}

function optionsFor(answer: string, distractors: readonly string[], random: () => number): [string, string, string] | null {
  const options = distinct([answer, ...distractors]).slice(0, 3);
  return options.length === 3 ? shuffle(options, random) as [string, string, string] : null;
}

function allExercises(section: Section): LocatedExercise[] {
  return section.lessons.flatMap(lesson => lesson.exercises.map(exercise => ({ exercise, section, lessonId: lesson.id })));
}

function convert(located: LocatedExercise, random: () => number): Candidate[] {
  const { exercise, section, lessonId } = located;
  const base = {
    exerciseId: exercise.id,
    reviewKey: `${section.grade}/${section.subject}/${section.section}/${lessonId}|${exercise.id}`,
    explain: 'explain' in exercise ? exercise.explain : undefined,
    speak: section.subject === 'english',
  };
  const candidates: Candidate[] = [];
  const push = (suffix: string, prompt: string, answer: string, distractors: string[]) => {
    const options = optionsFor(answer, distractors, random);
    if (options) candidates.push({ ...base, id: `${section.id}/${lessonId}/${exercise.id}${suffix}`, prompt, answer, options });
  };
  switch (exercise.type) {
    case 'choice':
      push('', exercise.prompt, exercise.answer, exercise.options.filter(value => normalizeAnswer(value) !== normalizeAnswer(exercise.answer)));
      break;
    case 'math': {
      const answer = String(exercise.answer);
      const offsets = shuffle([1, -1, 2, -2, 3, -3], random);
      push('', exercise.problem, answer, offsets.map(offset => exercise.answer + offset).filter(value => value >= 0).map(String));
      break;
    }
    case 'type':
    case 'fill': {
      if (!shortAnswer(exercise.answer)) break;
      const distractors = distractorsFor(located);
      push('', exercise.prompt, exercise.answer, distractors);
      break;
    }
    case 'match':
      exercise.pairs.forEach(([left, right], index) => {
        const distractors = exercise.pairs.filter((_, pairIndex) => pairIndex !== index).map(([, value]) => value)
          .filter(value => answerShape(value) === answerShape(right));
        push(`:${index}`, matchPrompt(left, right), right, distractors);
      });
      break;
    case 'order':
    case 'learn':
      break;
  }
  return candidates;
}

function locateMistake(key: string, sections: readonly Section[], subject: string): LocatedExercise | null {
  const split = key.lastIndexOf('|');
  if (split < 0) return null;
  const [grade, keySubject, sectionId, lessonId] = key.slice(0, split).split('/');
  if (keySubject !== subject) return null;
  const section = sections.find(item => item.grade === Number(grade) && item.subject === keySubject && item.section === sectionId);
  const exercise = section?.lessons.find(item => item.id === lessonId)?.exercises.find(item => item.id === key.slice(split + 1));
  return section && exercise ? { section, exercise, lessonId } : null;
}

/** Pure question selection. The caller supplies registry data and the review store's mistake keys. */
export function buildQuestionPool(input: QuestionPoolInput): GameQuestion[] {
  const { sections, grade, subject, section, mistakes, previousId, random = Math.random } = input;
  const count = Math.max(0, Math.floor(input.count ?? 5));
  if (!count) return [];
  const current = sections.find(item => item.grade === grade && item.subject === subject && item.section === section);
  const used = new Set<string>();
  const pick = (candidates: Candidate[], source: GameQuestion['source'], limit: number, mistakeKey?: string) => {
    const selected: GameQuestion[] = [];
    for (const candidate of shuffle(candidates, random)) {
      if (selected.length >= limit) break;
      if (used.has(candidate.id)) continue;
      used.add(candidate.id);
      selected.push({ ...candidate, options: candidate.options as [string, string, string], source, ...(mistakeKey ? { mistakeKey } : {}) });
    }
    return selected;
  };
  const mistakeLimit = Math.round(count * 0.3);
  const mistakeCards: GameQuestion[] = [];
  const mistakeKeys = [...new Set([...mistakes].reverse())];
  for (const key of mistakeKeys) {
    if (mistakeCards.length >= mistakeLimit) break;
    const located = locateMistake(key, sections, subject);
    if (!located) continue;
    mistakeCards.push(...pick(convert(located, random), 'mistake', mistakeLimit - mistakeCards.length, key));
  }
  const currentCards = current ? pick(allExercises(current).flatMap(item => convert(item, random)), 'current', count - mistakeCards.length) : [];
  const pool = [...mistakeCards, ...currentCards];
  if (pool.length < count) {
    const otherSections = sections.filter(item => item.grade === grade && item.subject === subject && item.section !== section);
    pool.push(...pick(otherSections.flatMap(item => allExercises(item).flatMap(exercise => convert(exercise, random))), 'top-up', count - pool.length));
  }
  if (previousId && pool.length > 1 && pool[0].id === previousId) {
    const swap = pool.findIndex(item => item.id !== previousId);
    [pool[0], pool[swap]] = [pool[swap], pool[0]];
  }
  return pool;
}
