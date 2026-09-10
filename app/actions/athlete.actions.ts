'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../../src/server/db/client';
import { AthleteRepository } from '../../src/server/repositories/athlete.repo';
import { AthleteService } from '../../src/core/services/athlete.service';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import { CreateAthleteSchema } from '../../src/core/validators/athlete.validator';

const athleteRepo = new AthleteRepository(db);
const athleteService = new AthleteService(athleteRepo);

export async function createAthleteAction(
  formData: FormData
): Promise<{ success: boolean; athlete?: { id: string; name: string; athleteCode: string }; error?: string }> {
  try {
    const session = await getCurrentSession();
    const teamId = session.team?.id || DEFAULT_TEAM_ID;

    const name = formData.get('name') as string;
    const athleteCode = (formData.get('athleteCode') as string) || undefined;
    const phone = (formData.get('phone') as string) || null;
    const startDate = (formData.get('startDate') as string) || new Date().toISOString().split('T')[0];

    const validated = CreateAthleteSchema.parse({
      teamId,
      name,
      athleteCode: athleteCode ? athleteCode.trim() : undefined,
      phone,
      startDate,
      status: 'ACTIVE',
    });

    const created = await athleteService.createAthlete(validated);
    try {
      revalidatePath('/athletes');
      revalidatePath('/');
    } catch {}

    return {
      success: true,
      athlete: {
        id: created.id,
        name: created.name,
        athleteCode: created.athleteCode,
      },
    };
  } catch (err: unknown) {
    console.error('createAthleteAction error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มนักกีฬา',
    };
  }
}

export async function toggleAthleteStatusAction(
  athleteId: string,
  currentStatus: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await athleteService.toggleStatus(athleteId, newStatus);
  revalidatePath('/athletes');
}

export async function deleteAthleteAction(athleteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await athleteService.deleteAthlete(athleteId);
    revalidatePath('/athletes');
    revalidatePath('/');
    revalidatePath('/sessions');
    return { success: true };
  } catch (err: unknown) {
    console.error('Delete athlete error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบนักกีฬา',
    };
  }
}

