import { Section as SectionSchema } from './schema';
import type { Section } from './schema';

const modules = import.meta.glob('./grade-*/**/*.ts', { eager: true }) as Record<string, Record<string, unknown>>;
const sections: Section[] = [];
for (const [path, module] of Object.entries(modules)) {
  const seen = new Set<unknown>();
  for (const value of Object.values(module)) {
    if (seen.has(value)) continue;
    seen.add(value);
    if (value && typeof value === 'object' && 'lessons' in value && 'section' in value) {
      sections.push(SectionSchema.parse(value));
    }
  }
  if (!Object.values(module).some(value => value && typeof value === 'object' && 'lessons' in value)) {
    throw new Error(`Файл ${path} не експортує розділ`);
  }
}

const subjectOrder: Record<string, number> = { math: 0, ukrainian: 1, english: 2 };
sections.sort((a, b) => a.grade - b.grade
  || (subjectOrder[a.subject] ?? 99) - (subjectOrder[b.subject] ?? 99)
  || (a.grade === 3 && a.subject === 'english' ? Number(b.section === 'test-prep') - Number(a.section === 'test-prep') : 0)
  || a.section.localeCompare(b.section));

const ids = new Set<string>();
for (const section of sections) {
  for (const id of [section.id, ...section.lessons.flatMap(lesson => [lesson.id, ...lesson.exercises.map(exercise => exercise.id)])]) {
    if (ids.has(id)) throw new Error(`Повторений ідентифікатор контенту: ${id}`);
    ids.add(id);
  }
}

export const contentRegistry: Section[] = sections;
export { Section } from './schema';
