import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../../../content';
import type { Exercise } from '../../../content/schema';
import { extractLatinSegments, feedbackSpeechText, promptSpeechText } from './speech';

describe('English speech text', () => {
  it('extracts only Latin-script phrases, including apostrophes and hyphens', () => {
    expect(extractLatinSegments('Що означає "teddy bears"?')).toEqual(['teddy bears']);
    expect(extractLatinSegments("He ___ can't dive (Він пірнає)")).toEqual(['He', "can't dive"]);
    expect(extractLatinSegments('Лише кирилиця 123')).toEqual([]);
  });

  it('does not offer a prompt speaker when no English prompt text exists', () => {
    const exercise: Exercise = {
      id: 'type-shells',
      type: 'type',
      prompt: 'Напиши англійською: мушлі',
      answer: 'shells',
    };
    expect(promptSpeechText(exercise)).toBeNull();
  });

  it('never puts the correct answer in prompt speech before Check for English content', () => {
    const exercises = contentRegistry
      .filter(section => section.subject === 'english')
      .flatMap(section => section.lessons.flatMap(lesson => lesson.exercises));
    expect(exercises.length).toBeGreaterThan(0);
    for (const exercise of exercises) {
      const speech = promptSpeechText(exercise);
      if (!speech || exercise.type === 'match' || exercise.type === 'math') continue;
      const answer = exercise.type === 'order' ? exercise.answer.join(' ') : exercise.answer;
      expect(speech.toLowerCase(), exercise.id).not.toContain(answer.toLowerCase());
    }
  });

  it('reads the correct English answer after Check', () => {
    const exercise: Exercise = {
      id: 'choice-bears',
      type: 'choice',
      prompt: 'Що означає "teddy bears"?',
      options: ['плюшеві ведмедики', 'пазли'],
      answer: 'плюшеві ведмедики',
      speak: true,
    };
    expect(promptSpeechText(exercise)).toBe('teddy bears');
    expect(feedbackSpeechText(exercise)).toBe('teddy bears');
  });
});
