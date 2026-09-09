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

export async function createAthleteAction(formData: FormData): Promise<void> {
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

  await athleteService.createAthlete(validated);
  revalidatePath('/athletes');
}

export async function toggleAthleteStatusAction(
  athleteId: string,
  currentStatus: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await athleteService.toggleStatus(athleteId, newStatus);
  revalidatePath('/athletes');
}

