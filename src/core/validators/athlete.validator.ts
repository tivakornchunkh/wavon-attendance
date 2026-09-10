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

export const CreateBatchAthletesSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  athletes: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Name is required').max(100),
        athleteCode: z.string().trim().optional(),
        phone: z.string().trim().max(20).optional().nullable(),
      })
    )
    .min(1, 'At least one athlete must be provided'),
});

export const UpdateAthleteSchema = z.object({
  athleteCode: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  status: AthleteStatusEnum.optional(),
});

export type CreateAthleteInput = z.infer<typeof CreateAthleteSchema>;
export type CreateBatchAthletesInput = z.infer<typeof CreateBatchAthletesSchema>;
export type UpdateAthleteInput = z.infer<typeof UpdateAthleteSchema>;

export interface ParsedRosterItem {
  name: string;
  athleteCode?: string;
  phone?: string | null;
}

/**
 * Smart Roster Parser:
 * Transforms pasted multi-line text into structured athlete objects.
 * Handles:
 * - Pure names: "สมชาย วิ่งเร็ว"
 * - Numbered items: "1. สมชาย วิ่งเร็ว", "1) สมชาย", "- สมชาย"
 * - Jersey / Code prefix: "10, สมชาย วิ่งเร็ว", "#7 สมชาย", "ATH-05 สมชาย"
 * - Tab or Comma separated items from Excel
 */
export function parseRosterText(rawText: string): ParsedRosterItem[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const results: ParsedRosterItem[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Remove leading list markers like "1. ", "1) ", "- ", "* ", "• "
    line = line.replace(/^(\d+[\.\)]\s*|[\-\*\•\–]\s*)/, '').trim();
    if (!line) continue;

    let athleteCode: string | undefined = undefined;
    let name = line;
    let phone: string | null = null;

    // Check comma or tab separation: e.g. "สมชาย วิ่งเร็ว, 10" or "10, สมชาย วิ่งเร็ว"
    if (line.includes(',') || line.includes('\t')) {
      const parts = line.split(/[,\t]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // If first part looks like a jersey number or code (e.g. "10", "#10", "ATH-01")
        if (/^(#?\d{1,4}|[A-Za-z0-9\-_]{2,8})$/.test(parts[0]) && isNaN(Number(parts[1]))) {
          athleteCode = parts[0].replace(/^#/, '');
          name = parts[1];
          if (parts[2]) phone = parts[2];
        } else if (parts[1].match(/^(#?\d{1,4}|[A-Za-z0-9\-_]{2,8})$/)) {
          name = parts[0];
          athleteCode = parts[1].replace(/^#/, '');
          if (parts[2]) phone = parts[2];
        } else {
          name = parts[0];
          if (parts[1].startsWith('0') && parts[1].length >= 9) {
            phone = parts[1];
          } else {
            athleteCode = parts[1];
          }
        }
      }
    } else {
      // Check space prefix pattern like "#10 สมชาย วิ่งเร็ว" or "No.10 สมชาย"
      const prefixMatch = name.match(/^(?:#|No\.?\s*)(\d{1,4})\s+(.+)$/i);
      if (prefixMatch) {
        athleteCode = prefixMatch[1];
        name = prefixMatch[2].trim();
      }
    }

    if (name.length > 0) {
      results.push({
        name,
        athleteCode: athleteCode ? athleteCode.trim() : undefined,
        phone: phone ? phone.trim() : null,
      });
    }
  }

  return results;
}
