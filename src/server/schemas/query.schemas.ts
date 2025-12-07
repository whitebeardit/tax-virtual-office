import { z } from 'zod';

export const userQueryRequestSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  context: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export type UserQueryRequestSchema = z.infer<typeof userQueryRequestSchema>;
