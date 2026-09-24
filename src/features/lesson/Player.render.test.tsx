import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../../content/schema';
import { ExerciseView } from './ExerciseView';
import { FeedbackSheet } from './Player';

describe('lesson explanation rendering', () => {
  const exercise: Exercise = {
    id: 'explain-test', type: 'choice', prompt: 'He ___ got a ball?',
    options: ['has', 'have'], answer: 'has', speak: true,
    explain: 'He — це «він», тому has got.',
  };

  it('hides the explanation before Check and shows it with the correct answer after a wrong answer', () => {
    const before = renderToStaticMarkup(createElement(ExerciseView, {
      exercise, answer: 'have', onAnswer: () => {}, onWrongPair: () => {}, disabled: false,
    }));
    expect(before).not.toContain('Чому так:');
    expect(before).not.toContain(exercise.explain);
    const after = renderToStaticMarkup(createElement(FeedbackSheet, {
      exercise, correct: false, onContinue: () => {}, voice: null,
    }));
    expect(after).toContain('Правильна відповідь:');
    expect(after).toContain('>has</b>');
    expect(after).toContain('Чому так:');
    expect(after).toContain(exercise.explain);
  });

  it('shows a compact explanation after a correct answer', () => {
    const after = renderToStaticMarkup(createElement(FeedbackSheet, {
      exercise, correct: true, onContinue: () => {}, voice: null,
    }));
    expect(after).toContain('feedback-explain compact');
    expect(after).toContain(exercise.explain);
  });

  it('renders a learn card as a table with a speaker for each English row', () => {
    const card: Exercise = { id: 'learn-test', type: 'learn', title: 'Вчимо слова',
      rows: [['can', 'вмію'], ['sing', 'співати']] };
    const html = renderToStaticMarkup(createElement(ExerciseView, {
      exercise: card, answer: '', onAnswer: () => {}, onWrongPair: () => {}, disabled: false,
    }));
    expect(html).toContain('<table');
    expect(html).toContain('Вивчаємо');
    expect(html.match(/Прослухати англійською:/g)).toHaveLength(2);
  });
});
