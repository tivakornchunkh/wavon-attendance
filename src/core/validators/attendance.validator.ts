import { z } from 'zod';

export const AttendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'LEAVE']);

export const AttendanceItemSchema = z.object({
  athleteId: z.string().min(1, 'Athlete ID is required'),
  status: AttendanceStatusEnum,
  notes: z.string().trim().max(255).optional().nullable(),
});

export const BatchRecordAttendanceSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  checkedBy: z.string().min(1, 'CheckedBy coach ID is required'),
  records: z.array(AttendanceItemSchema).min(1, 'At least one attendance record is required'),
});

export const UpdateAttendanceStatusSchema = z.object({
  status: AttendanceStatusEnum,
  changedBy: z.string().min(1, 'ChangedBy coach ID is required'),
  reason: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(255).optional().nullable(),
});

export const AttendanceFilterSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  athleteId: z.string().optional(),
  sessionId: z.string().optional(),
  status: AttendanceStatusEnum.optional(),
});

export type AttendanceItemInput = z.infer<typeof AttendanceItemSchema>;
export type BatchRecordAttendanceInput = z.infer<typeof BatchRecordAttendanceSchema>;
export type UpdateAttendanceStatusInput = z.infer<typeof UpdateAttendanceStatusSchema>;
export type AttendanceFilterInput = z.infer<typeof AttendanceFilterSchema>;

