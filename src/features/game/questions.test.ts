import { describe, expect, it } from 'vitest';
import type { Section } from '../../../content/schema';
import { contentRegistry } from '../../../content';
import { buildQuestionPool, normalizeAnswer, questionSpeechText } from './questions';

const section = (id: string, exercises: Section['lessons'][number]['exercises'], subject = 'english', grade = 3): Section => ({
  id, grade, subject, section: id, title: id, lessons: [{ id: 'lesson', title: 'Lesson', exercises }],
});
const first = () => 0;

describe('question conversion', () => {
  it('speaks only Latin text from the answer, then the prompt', () => {
    const card = { answer: 'вересень', prompt: 'Що означає «September»?' };
    expect(questionSpeechText(card)).toBe('September');
    expect(questionSpeechText({ ...card, answer: 'Friday' })).toBe('Friday');
    expect(questionSpeechText({ answer: 'вересень', prompt: 'Який це місяць?' })).toBeNull();
  });

  it('converts authored choices and carries explain and English speech', () => {
    const source = section('current', [{ id: 'choice', type: 'choice', prompt: 'Pick', options: ['A', 'B', 'C'], answer: 'B', explain: 'Because B.', speak: true }]);
    const [card] = buildQuestionPool({ sections: [source], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 1, random: first });
    expect(card).toMatchObject({ prompt: 'Pick', answer: 'B', explain: 'Because B.', speak: true, source: 'current', reviewKey: '3/english/current/lesson|choice' });
    expect(new Set(card.options)).toEqual(new Set(['A', 'B', 'C']));
  });

  it('makes non-negative, distinct math alternatives', () => {
    const source = section('current', [{ id: 'math', type: 'math', problem: '0 + 0 = ?', answer: 0 }], 'math');
    const [card] = buildQuestionPool({ sections: [source], grade: 3, subject: 'math', section: 'current', mistakes: [], count: 1, random: first });
    expect(card.prompt).toBe('0 + 0 = ?');
    expect(card.options.map(Number).every(value => value >= 0)).toBe(true);
    expect(new Set(card.options).size).toBe(3);
    expect(card.options).toContain('0');
  });

  it('takes type and fill alternatives from other exercises of the same type', () => {
    const source = section('current', [
      { id: 'type-a', type: 'type', prompt: 'Type A', answer: 'apple' },
      { id: 'type-b', type: 'type', prompt: 'Type B', answer: 'banana' },
      { id: 'type-c', type: 'type', prompt: 'Type C', answer: 'cherry' },
      { id: 'fill-a', type: 'fill', prompt: '___ red', answer: 'is' },
      { id: 'fill-b', type: 'fill', prompt: '___ blue', answer: 'are' },
      { id: 'fill-c', type: 'fill', prompt: '___ green', answer: 'was' },
    ]);
    const cards = buildQuestionPool({ sections: [source], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 6, random: first });
    expect(cards.find(card => card.exerciseId === 'type-a')?.options).toEqual(expect.arrayContaining(['apple', 'banana', 'cherry']));
    expect(cards.find(card => card.exerciseId === 'fill-a')?.options).toEqual(expect.arrayContaining(['is', 'are', 'was']));
    for (const card of cards) {
      expect(new Set(card.options.map(normalizeAnswer)).size).toBe(3);
      expect(card.options.filter(option => normalizeAnswer(option) === normalizeAnswer(card.answer))).toHaveLength(1);
    }
  });

  it('turns match pairs into distinct three-option cards and skips order and learn', () => {
    const source = section('current', [
      { id: 'match', type: 'match', pairs: [['left', 'ліворуч'], ['right', 'праворуч'], ['up', 'вгору']] },
      { id: 'order', type: 'order', prompt: 'Order', tokens: ['a'], answer: ['a'] },
      { id: 'learn', type: 'learn', title: 'Learn', rows: [['hi', 'привіт']] },
    ]);
    const cards = buildQuestionPool({ sections: [source], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 5, random: first });
    expect(cards).toHaveLength(3);
    expect(cards.map(card => card.prompt)).toEqual(expect.arrayContaining(['Що означає «left»?', 'Що означає «right»?', 'Що означає «up»?']));
    expect(cards.every(card => card.options.length === 3)).toBe(true);
  });

  it('uses question wording that matches the scripts in each pair', () => {
    const source = section('current', [
      { id: 'digits', type: 'match', pairs: [['45', 'forty-five'], ['32', 'thirty-two'], ['67', 'sixty-seven']] },
      { id: 'translation', type: 'match', pairs: [['September', 'вересень'], ['May', 'травень'], ['June', 'червень']] },
      { id: 'reverse', type: 'match', pairs: [['вересень', 'September'], ['травень', 'May'], ['червень', 'June']] },
    ]);
    const cards = buildQuestionPool({ sections: [source], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 20, random: first });
    expect(cards.find(card => card.exerciseId === 'digits' && card.answer === 'forty-five')?.prompt).toBe('Як записати число 45 словами?');
    expect(cards.find(card => card.exerciseId === 'translation' && card.answer === 'вересень')?.prompt).toBe('Що означає «September»?');
    expect(cards.find(card => card.exerciseId === 'reverse' && card.answer === 'September')?.prompt).toBe('Як сказати англійською «вересень»?');
  });
});

describe('question pool', () => {
  it('keeps real test-prep distractors in the same lesson and answer shape', () => {
    const section = contentRegistry.find(item => item.grade === 3 && item.subject === 'english' && item.section === 'test-prep');
    expect(section).toBeDefined();
    const lesson = section!.lessons.find(item => item.id === 'g3-en-tp-l4')!;
    const otherSection = { ...section!, id: 'other-section', section: 'other-section', lessons: [{ id: 'other-lesson', title: 'Other', exercises: [
      { id: 'other-fill', type: 'fill' as const, prompt: 'Other ___', answer: 'faraway' },
    ] }] };
    const cards = buildQuestionPool({ sections: [section!, otherSection], grade: 3, subject: 'english', section: 'test-prep', mistakes: [], count: 100, random: first });
    const date = cards.find(card => card.exerciseId === 'g3-en-tp-l4-e08');
    expect(date).toBeDefined();
    expect(date?.answer).toBe('of');
    expect(date?.options).not.toContain('P.');
    expect(date?.options).not.toContain('faraway');
    expect(date?.options).not.toContain('forty');
    expect(date?.options).not.toContain('seventy-six');
    expect(date?.options.every(option => /^[A-Za-z][A-Za-z'’-]*$/.test(option))).toBe(true);
    const lessonWords = new Set(lesson.exercises.flatMap(exercise => {
      if (exercise.type === 'match') return exercise.pairs.flat();
      if (exercise.type === 'order') return exercise.answer;
      if ('answer' in exercise) return [String(exercise.answer)];
      return [];
    }));
    expect(date?.options.filter(option => option !== 'of').some(option => lessonWords.has(option))).toBe(true);
    const number = cards.find(card => card.exerciseId === 'g3-en-tp-l4-e10' && card.answer === 'forty-five');
    expect(number?.prompt).toBe('Як записати число 45 словами?');
  });

  it('uses other lessons in the same section when one lesson lacks alternatives', () => {
    const source: Section = { ...section('current', [{ id: 'only', type: 'fill', prompt: 'A ___', answer: 'apple' }]), lessons: [
      { id: 'first', title: 'First', exercises: [{ id: 'only', type: 'fill', prompt: 'A ___', answer: 'apple' }] },
      { id: 'second', title: 'Second', exercises: [
        { id: 'other-a', type: 'fill', prompt: 'B ___', answer: 'banana' },
        { id: 'other-b', type: 'fill', prompt: 'C ___', answer: 'cherry' },
      ] },
    ] };
    const cards = buildQuestionPool({ sections: [source], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 3, random: first });
    expect(cards.find(card => card.exerciseId === 'only')?.options).toEqual(expect.arrayContaining(['apple', 'banana', 'cherry']));
  });

  it('does not mix one-word, multi-word, number, and single-letter answers', () => {
    const source = section('shapes', [
      { id: 'word', type: 'fill', prompt: 'A ___', answer: 'word' },
      { id: 'word-b', type: 'fill', prompt: 'B ___', answer: 'apple' },
      { id: 'word-c', type: 'fill', prompt: 'C ___', answer: 'orange' },
      { id: 'letter', type: 'fill', prompt: 'D ___', answer: 'P' },
      { id: 'phrase', type: 'fill', prompt: 'E ___', answer: 'two words' },
      { id: 'number', type: 'fill', prompt: 'F ___', answer: '45' },
    ]);
    const cards = buildQuestionPool({ sections: [source], grade: 3, subject: 'english', section: 'shapes', mistakes: [], count: 10, random: first });
    expect(cards.find(card => card.exerciseId === 'word')?.options).toEqual(expect.arrayContaining(['word', 'apple', 'orange']));
    expect(cards.find(card => card.exerciseId === 'word')?.options).not.toContain('P');
    expect(cards.find(card => card.exerciseId === 'phrase')).toBeUndefined();
    expect(cards.find(card => card.exerciseId === 'number')).toBeUndefined();
  });
  it('has at least five answerable cards for every published section', () => {
    for (const section of contentRegistry) {
      const cards = buildQuestionPool({ sections: contentRegistry, grade: section.grade, subject: section.subject, section: section.section, mistakes: [], count: 5, random: first });
      expect(cards.length, `${section.grade}/${section.subject}/${section.section}`).toBe(5);
    }
  });

  const current = section('current', Array.from({ length: 5 }, (_, index) => ({
    id: `c${index}`, type: 'choice' as const, prompt: `Current ${index}`, options: ['one', 'two', 'three'], answer: 'one', speak: false,
  })));
  const old = section('old', Array.from({ length: 3 }, (_, index) => ({
    id: `m${index}`, type: 'choice' as const, prompt: `Mistake ${index}`, options: ['one', 'two', 'three'], answer: 'one', speak: false,
  })));

  it('puts subject mistakes first at a 30/70 split and keeps their review key', () => {
    const keys = ['3/english/old/lesson|m0', '3/english/old/lesson|m1', '3/math/old/lesson|m2'];
    const cards = buildQuestionPool({ sections: [current, old], grade: 3, subject: 'english', section: 'current', mistakes: keys, count: 5, random: first });
    expect(cards).toHaveLength(5);
    expect(cards.slice(0, 2).map(card => card.source)).toEqual(['mistake', 'mistake']);
    expect(cards.slice(0, 2).every(card => keys.includes(card.mistakeKey ?? ''))).toBe(true);
    expect(cards.slice(2).every(card => card.source === 'current')).toBe(true);
    expect(new Set(cards.map(card => card.id)).size).toBe(5);
  });

  it('tops up from other sections of the same grade and subject', () => {
    const sparse = section('current', [{ id: 'only', type: 'choice', prompt: 'Only', options: ['a', 'b', 'c'], answer: 'a', speak: false }]);
    const cards = buildQuestionPool({ sections: [sparse, old], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 4, random: first });
    expect(cards).toHaveLength(4);
    expect(cards[0].source).toBe('current');
    expect(cards.slice(1).every(card => card.source === 'top-up')).toBe(true);
    expect(cards[0].reviewKey).toBe('3/english/current/lesson|only');
    expect(cards.slice(1).map(card => card.reviewKey).sort()).toEqual([
      '3/english/old/lesson|m0', '3/english/old/lesson|m1', '3/english/old/lesson|m2',
    ]);
  });

  it('avoids the previous card when starting a new pool', () => {
    const cards = buildQuestionPool({ sections: [current], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 3, random: first });
    const next = buildQuestionPool({ sections: [current], grade: 3, subject: 'english', section: 'current', mistakes: [], count: 3, previousId: cards[0].id, random: first });
    expect(next[0].id).not.toBe(cards[0].id);
  });
});
