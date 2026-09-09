import { z } from 'zod';

export const AthleteStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const CreateAthleteSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  athleteCode: z.string().trim().optional(), // If empty, will auto-generate
  name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().trim().max(20).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  status: AthleteStatusEnum.default('ACTIVE'),
});

export const UpdateAthleteSchema = z.object({
  athleteCode: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  status: AthleteStatusEnum.optional(),
});

export type CreateAthleteInput = z.infer<typeof CreateAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof UpdateAthleteSchema>;

