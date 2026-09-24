import { describe, it, expect } from 'vitest';
import { Section, Exercise } from './schema';
import { contentRegistry } from './index';

describe('content schema validation', () => {
  it('loads all sections without errors', () => {
    expect(contentRegistry).toBeDefined();
    expect(Array.isArray(contentRegistry)).toBe(true);
    expect(contentRegistry.length).toBeGreaterThan(0);
  });

  it('validates section structure', () => {
    contentRegistry.forEach(section => {
      expect(section.id).toBeDefined();
      expect(typeof section.id).toBe('string');
      expect(section.grade).toBeDefined();
      expect(typeof section.grade).toBe('number');
      expect(section.subject).toBeDefined();
      expect(section.section).toBeDefined();
      expect(section.title).toBeDefined();
      expect(Array.isArray(section.lessons)).toBe(true);
    });
  });

  it('ensures unique lesson ids within sections', () => {
    contentRegistry.forEach(section => {
      const ids = section.lessons.map(l => l.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  it('ensures unique exercise ids within lessons', () => {
    contentRegistry.forEach(section => {
      section.lessons.forEach(lesson => {
        const ids = lesson.exercises.map(e => e.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
      });
    });
  });

  it('ensures globally unique exercise ids', () => {
    const allExerciseIds = new Set<string>();
    
    contentRegistry.forEach(section => {
      section.lessons.forEach(lesson => {
        lesson.exercises.forEach(exercise => {
          expect(allExerciseIds.has(exercise.id)).toBe(false);
          allExerciseIds.add(exercise.id);
        });
      });
    });
  });

  it('validates exercise types', () => {
    const validTypes = ['choice', 'match', 'type', 'order', 'fill', 'math', 'learn'];
    
    contentRegistry.forEach(section => {
      section.lessons.forEach(lesson => {
        lesson.exercises.forEach(exercise => {
          expect(validTypes).toContain(exercise.type);
        });
      });
    });
  });

  it('places the complete English test review first with playable lesson content', () => {
    const english = contentRegistry.filter(section => section.grade === 3 && section.subject === 'english');
    expect(english[0].id).toBe('g3-english-test-prep');
    expect(english[0].lessons.map(lesson => lesson.exercises.length)).toEqual([14, 14, 13, 14, 15]);
    english[0].lessons.forEach((lesson, lessonIndex) => {
      expect(lesson.exercises.filter(exercise => exercise.type === 'learn')).toHaveLength(lessonIndex < 4 ? 2 : 0);
      if (lessonIndex < 4) expect(lesson.exercises.slice(0, 2).map(exercise => exercise.type)).toEqual(['learn', 'learn']);
      expect(new Set(lesson.exercises.map(exercise => exercise.type)).size).toBeGreaterThanOrEqual(4);
      lesson.exercises.forEach((exercise, exerciseIndex) => {
        expect(Exercise.safeParse(exercise).success).toBe(true);
        expect(exercise.id).toBe(`g3-en-tp-l${lessonIndex + 1}-e${String(exerciseIndex + 1).padStart(2, '0')}`);
        if (exercise.type !== 'learn') {
          expect(exercise.explain, exercise.id).toBeTruthy();
          expect(exercise.explain!.length, exercise.id).toBeLessThanOrEqual(160);
        }
        if (exercise.type === 'choice') {
          expect(new Set(exercise.options).size).toBe(exercise.options.length);
          expect(exercise.options.filter(option => option === exercise.answer)).toHaveLength(1);
        }
      });
    });
  });

  it('rejects explanations longer than 160 characters', () => {
    const example = { id: 'limit', type: 'math', problem: '1 + 1', answer: 2, explain: 'а'.repeat(161) };
    expect(Exercise.safeParse(example).success).toBe(false);
  });
});
