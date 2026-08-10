import { z } from 'zod';

const splitupEntry = z.object({
  count: z.number().int().min(0),
  marksPerQuestion: z.number().min(0),
});

export const questionSplitupSchema = z.object({
  mcq: splitupEntry,
  fillInBlanks: splitupEntry,
  matchTheFollowing: splitupEntry,
  trueFalse: splitupEntry,
  shortAnswer: splitupEntry,
  descriptive: splitupEntry,
  detailed: splitupEntry,
  imageBased: splitupEntry,
});

export const questionTypeSchema = z.enum([
  'MCQ',
  'FILL_IN_BLANKS',
  'MATCH_THE_FOLLOWING',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'DESCRIPTIVE',
  'DETAILED',
  'IMAGE_BASED',
]);

export const questionSchema = z.object({
  id: z.string().optional(),
  type: questionTypeSchema,
  text: z.string().min(1, 'Question text is required'),
  options: z
    .union([
      z.array(z.string()),
      z.object({ left: z.array(z.string()), right: z.array(z.string()) }),
    ])
    .optional(),
  answer: z
    .union([
      z.string(),
      z.array(z.string()),
      z.array(z.object({ left: z.string(), right: z.string() })),
    ])
    .optional(),
  marks: z.number().int().min(1),
  order: z.number().int().min(0),
  imageUrl: z.string().optional(),
});

export const paperSchema = z.object({
  title: z.string().min(1).optional(),
  subject: z.string().min(1, 'Subject is required'),
  totalMarks: z.number().int().min(1),
  totalHours: z.number().min(0),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
  questionSplitup: questionSplitupSchema,
  schoolId: z.string().nullable().optional(),
});

export const updatePaperSchema = paperSchema.partial();

export type PaperInput = z.infer<typeof paperSchema>;
export type UpdatePaperInput = z.infer<typeof updatePaperSchema>;
