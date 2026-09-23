import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../../../content';
import type { Exercise, Lesson } from '../../../content/schema';
import { checkExercise, continueLesson, isAnswerReady, lessonResult, startLesson, submitAnswer, submitWrongPair } from './engine';

const samples: { exercise: Exercise; right: string | string[] | number[]; wrong: string | string[] | number[] }[] = [
  { exercise: { id: 'c', type: 'choice', prompt: 'Обери', options: ['а', 'б'], answer: 'а', speak: false }, right: 'а', wrong: 'б' },
  { exercise: { id: 'm', type: 'match', pairs: [['2', 'два'], ['3', 'три']] }, right: [0, 1], wrong: [1, 0] },
  { exercise: { id: 't', type: 'type', prompt: 'Напиши', answer: 'Київ', accept: ['Києв'] }, right: ' київ! ', wrong: 'Львів' },
  {
    exercise: {
      id: 'o', type: 'order', prompt: 'Склади', tokens: ['This', 'is', 'my', 'cat'],
      answer: ['This', 'is', 'my', 'cat'],
    },
    right: ['This', 'is', 'my', 'cat'],
    wrong: ['is', 'This', 'my', 'cat'],
  },
  { exercise: { id: 'f', type: 'fill', prompt: 'Я ___', answer: 'читаю', options: ['читаю', 'пишу'] }, right: 'Читаю.', wrong: 'пишу' },
  { exercise: { id: 'n', type: 'math', problem: '2 + 2', answer: 4 }, right: '4', wrong: '5' },
];

describe('lesson engine', () => {
  it.each(samples)('$exercise.type checker accepts right and rejects wrong', ({ exercise, right, wrong }) => {
    expect(checkExercise(exercise, right)).toBe(true);
    expect(checkExercise(exercise, wrong)).toBe(false);
  });
  it('requeues wrong exercises and finishes only after all are solved', () => {
    const lesson: Lesson = { id: 'test', title: 'Тест', exercises: samples.slice(0, 2).map(item => item.exercise) };
    let state = startLesson(lesson, () => 0.99);
    state = continueLesson(submitAnswer(state, 'б'));
    expect(state.queue.map(item => item.id)).toEqual(['m', 'c']);
    expect(state.solved).toEqual([]);
    state = continueLesson(submitAnswer(state, [0, 1]));
    expect(state.phase).toBe('answer');
    state = continueLesson(submitAnswer(state, 'а'));
    expect(state.phase).toBe('complete');
    expect(state.solved).toHaveLength(2);
    expect(lessonResult(state)).toEqual({ accuracy: 0.5, stars: 1, xp: 12 });
  });
  it('counts a wrong match tap as an attempt and requeues the exercise', () => {
    const lesson: Lesson = { id: 'match', title: 'Пари', exercises: [samples[1].exercise] };
    let state = startLesson(lesson);
    state = submitWrongPair(state, 0, 1);
    expect(state.phase).toBe('feedback');
    state = continueLesson(state);
    expect(state.phase).toBe('answer');
    state = continueLesson(submitAnswer(state, [0, 1]));
    expect(state.phase).toBe('complete');
    expect(lessonResult(state).accuracy).toBe(0);
  });
  it('accepts identical right-hand labels in either matching position', () => {
    const exercise: Exercise = { id: 'duplicate', type: 'match', pairs: [['а', 'голосний'], ['м', 'приголосний'], ['и', 'голосний']] };
    expect(checkExercise(exercise, [2, 1, 0])).toBe(true);
    expect(checkExercise(exercise, [1, 0, 2])).toBe(false);
    expect(checkExercise(exercise, [0, 1, 0])).toBe(false);
  });
  it('calculates thresholds for stars, accuracy and XP', () => {
    const lesson: Lesson = {
      id: 'ten',
      title: 'Десять',
      exercises: Array.from(
        { length: 10 }, (_, i) => ({ id: `e${i}`, type: 'math' as const, problem: '1 + 1', answer: 2 }),
      ),
    };
    for (const [correctCount, stars] of [[10, 3], [9, 3], [8, 2], [7, 2], [6, 1]]) {
      let state = startLesson(lesson, () => 0.99);
      for (let i = 0; i < 10; i++) state = continueLesson(submitAnswer(state, i < correctCount ? '2' : '3'));
      expect(lessonResult(state).stars).toBe(stars);
      expect(lessonResult(state).accuracy).toBe(correctCount / 10);
      expect(lessonResult(state).xp).toBe(10 + correctCount * 2);
    }
  });
  it('plays a real lesson through to completion after a retry', () => {
    const lesson = contentRegistry.find(section => section.subject === 'math')!.lessons[0];
    let state = startLesson(lesson, () => 0.99);
    const answerFor = (exercise: Exercise) => exercise.type === 'match'
      ? exercise.pairs.map((_, i) => i)
      : exercise.type === 'order' ? exercise.answer : String(exercise.answer);
    state = continueLesson(submitAnswer(state, 'неправильно'));
    while (state.phase !== 'complete') {
      const answer = answerFor(state.queue[0]);
      expect(isAnswerReady(state.queue[0], answer)).toBe(true);
      state = continueLesson(submitAnswer(state, answer));
    }
    expect(state.solved).toHaveLength(lesson.exercises.length);
    expect(state.attempts).toHaveLength(lesson.exercises.length + 1);
    expect(lessonResult(state).xp).toBe(10 + (lesson.exercises.length - 1) * 2);
  });
});
