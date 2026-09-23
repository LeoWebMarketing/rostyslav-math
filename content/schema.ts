import { z } from 'zod';

const BaseExercise = z.object({
  id: z.string(),
  type: z.string(),
  hint: z.string().optional(),
});

const ChoiceExercise = BaseExercise.extend({
  type: z.literal('choice'),
  prompt: z.string(),
  image: z.string().optional(),
  audio: z.string().optional(),
  options: z.array(z.string()),
  answer: z.string(),
  speak: z.boolean().default(false),
  optionEmoji: z.record(z.string()).optional(),
});

const MatchExercise = BaseExercise.extend({
  type: z.literal('match'),
  pairs: z.array(z.tuple([z.string(), z.string()])),
  speak: z.boolean().optional(),
});

const TypeExercise = BaseExercise.extend({
  type: z.literal('type'),
  prompt: z.string(),
  image: z.string().optional(),
  answer: z.string(),
  accept: z.array(z.string()).optional(),
  typoTolerance: z.number().optional(),
  speak: z.boolean().optional(),
});

const OrderExercise = BaseExercise.extend({
  type: z.literal('order'),
  prompt: z.string(),
  tokens: z.array(z.string()),
  answer: z.array(z.string()),
  accept: z.array(z.array(z.string())).optional(),
  speak: z.boolean().optional(),
});

const FillExercise = BaseExercise.extend({
  type: z.literal('fill'),
  prompt: z.string(),
  answer: z.string(),
  accept: z.array(z.string()).optional(),
  options: z.array(z.string()).optional(),
  speak: z.boolean().optional(),
});

const MathExercise = BaseExercise.extend({
  type: z.literal('math'),
  problem: z.string(),
  answer: z.number(),
});

export const Exercise = z.union([
  ChoiceExercise,
  MatchExercise,
  TypeExercise,
  OrderExercise,
  FillExercise,
  MathExercise,
]);

export const Lesson = z.object({
  id: z.string(),
  title: z.string(),
  exercises: z.array(Exercise),
});

export const Section = z.object({
  id: z.string(),
  grade: z.number(),
  subject: z.string(),
  section: z.string(),
  title: z.string(),
  lessons: z.array(Lesson),
  draft: z.boolean().optional(),
});

export type Exercise = z.infer<typeof Exercise>;
export type Lesson = z.infer<typeof Lesson>;
export type Section = z.infer<typeof Section>;
