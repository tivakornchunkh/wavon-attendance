import { z } from 'zod';

export const CreateSessionSchema = z
  .object({
    teamId: z.string().min(1, 'Team ID is required'),
    title: z.string().trim().min(1, 'Title is required').max(150),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'),
    createdBy: z.string().min(1, 'CreatedBy user ID is required'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const QuickSessionSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  title: z.string().trim().min(1).max(150).default('ซ้อมประจำวัน'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format').optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format').optional(),
  createdBy: z.string().min(1, 'CreatedBy user ID is required'),
});

export const UpdateSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format').optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type QuickSessionInput = z.infer<typeof QuickSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;

