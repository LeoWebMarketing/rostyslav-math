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
    const validTypes = ['choice', 'match', 'type', 'order', 'fill', 'math'];
    
    contentRegistry.forEach(section => {
      section.lessons.forEach(lesson => {
        lesson.exercises.forEach(exercise => {
          expect(validTypes).toContain(exercise.type);
        });
      });
    });
  });
});
