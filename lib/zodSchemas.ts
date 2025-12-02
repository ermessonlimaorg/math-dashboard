import { z } from 'zod'

export const difficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD'])

export const createQuestionSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(3),
  topic: z.string().min(2).optional(),
  difficulty: difficultyEnum.optional(),
  externalId: z.string().optional()
})

export const updateQuestionSchema = createQuestionSchema.partial()

export const solutionStepSchema = z.object({
  externalId: z.string().optional(),
  questionId: z.string().optional(),
  questionExternalId: z.string().optional(),
  order: z.number().int().min(1),
  content: z.string().min(1)
})

export const attemptSchema = z.object({
  externalId: z.string().optional(),
  questionId: z.string().optional(),
  questionExternalId: z.string().optional(),
  userId: z.string().optional(),
  appUserId: z.string().optional(),
  studentName: z.string().optional(),
  correct: z.boolean(),
  timeMs: z.number().int().nonnegative(),
  attempts: z.number().int().min(1).default(1),
  source: z.string().default('app'),
  topic: z.string().optional(),
  difficulty: difficultyEnum.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

export const feedbackSchema = z.object({
  externalId: z.string().optional(),
  questionId: z.string().optional(),
  questionExternalId: z.string().optional(),
  userId: z.string().optional(),
  appUserId: z.string().optional(),
  studentName: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

export const syncPayloadSchema = z.object({
  apiKey: z.string().optional(),
  questions: z.array(createQuestionSchema.extend({ externalId: z.string() })).optional(),
  solutionSteps: z.array(solutionStepSchema.extend({ externalId: z.string() })).optional(),
  attempts: z.array(attemptSchema.extend({ externalId: z.string() })).optional(),
  feedbacks: z.array(feedbackSchema.extend({ externalId: z.string() })).optional()
})
