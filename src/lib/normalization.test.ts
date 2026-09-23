import { describe, it, expect } from 'vitest';
import { normalizeAnswer, checkAnswer } from './normalization';

describe('normalizeAnswer', () => {
  it('trims whitespace', () => {
    expect(normalizeAnswer('  answer  ')).toBe('answer');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeAnswer('hello    world')).toBe('hello world');
  });

  it('converts to lowercase', () => {
    expect(normalizeAnswer('HELLO')).toBe('hello');
  });

  it('unifies apostrophes', () => {
    expect(normalizeAnswer("don't")).toBe("don't");
    expect(normalizeAnswer('don’t')).toBe("don't");
    expect(normalizeAnswer("donʼt")).toBe("don't");
  });

  it('removes trailing punctuation', () => {
    expect(normalizeAnswer('answer.')).toBe('answer');
    expect(normalizeAnswer('answer!')).toBe('answer');
    expect(normalizeAnswer('answer?')).toBe('answer');
    expect(normalizeAnswer('answer,')).toBe('answer');
    expect(normalizeAnswer('answer;')).toBe('answer');
    expect(normalizeAnswer('answer:')).toBe('answer');
    expect(normalizeAnswer('answer…')).toBe('answer');
  });

  it('preserves ґ and г (no folding)', () => {
    expect(normalizeAnswer('ґ')).toBe('ґ');
    expect(normalizeAnswer('г')).toBe('г');
    expect(normalizeAnswer('ґреко')).not.toBe(normalizeAnswer('греко'));
  });

  it('preserves і and i (no folding)', () => {
    expect(normalizeAnswer('і')).toBe('і');
    expect(normalizeAnswer('i')).toBe('i');
    expect(normalizeAnswer('і')).not.toBe(normalizeAnswer('i'));
  });

  it('applies NFC normalization', () => {
    const combined = 'é'; // e + combining acute
    const precomposed = 'é'; // é
    expect(normalizeAnswer(combined)).toBe(normalizeAnswer(precomposed));
  });
});

describe('checkAnswer', () => {
  it('matches exact normalized answer', () => {
    expect(checkAnswer('Answer', 'answer')).toBe(true);
  });

  it('handles apostrophe variants', () => {
    expect(checkAnswer("don't", "don't")).toBe(true);
    expect(checkAnswer("donʼt", "don't")).toBe(true);
  });

  it('ignores trailing punctuation', () => {
    expect(checkAnswer('answer.', 'answer')).toBe(true);
    expect(checkAnswer('answer!', 'answer')).toBe(true);
  });

  it('accepts array of alternatives', () => {
    expect(checkAnswer('dog', ['cat', 'dog', 'fox'])).toBe(true);
    expect(checkAnswer('bird', ['cat', 'dog', 'fox'])).toBe(false);
  });

  it('applies typo tolerance', () => {
    expect(checkAnswer('answr', 'answer', 1)).toBe(true); // 1 error
    expect(checkAnswer('answr', 'answer', 0)).toBe(false); // no tolerance
  });

  it('does not fold ґ/г', () => {
    expect(checkAnswer('ґреко', 'греко')).toBe(false);
  });

  it('does not fold і/i', () => {
    expect(checkAnswer('міста', 'miсta')).toBe(false);
  });
});
