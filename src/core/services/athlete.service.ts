import { AthleteRepository } from '../../server/repositories/athlete.repo';
import { CreateAthleteInput, UpdateAthleteInput } from '../validators/athlete.validator';
import { Athlete } from '../domain/athlete';
import crypto from 'crypto';

export class AthleteService {
  constructor(private athleteRepo: AthleteRepository) {}

  /**
   * สร้างนักกีฬาใหม่ พร้อม Auto-generate athlete_code ถ้าไม่ได้ระบุ (ตามผล Grilling Q7: C)
   */
  async createAthlete(input: CreateAthleteInput): Promise<Athlete> {
    let athleteCode = input.athleteCode?.trim();

    if (!athleteCode) {
      // Auto-generate: เช่น ATH-001, ATH-002 ตามจำนวนนักกีฬาในทีม
      const currentCount = await this.athleteRepo.countByTeam(input.teamId);
      athleteCode = `ATH-${String(currentCount + 1).padStart(3, '0')}`;

      // ตรวจสอบว่าซ้ำหรือไม่ ถ้าซ้ำให้บวกเลขขึ้นไป
      let counter = currentCount + 1;
      while (await this.athleteRepo.findByCode(input.teamId, athleteCode)) {
        counter++;
        athleteCode = `ATH-${String(counter).padStart(3, '0')}`;
      }
    } else {
      // ตรวจสอบความซ้ำซ้อนในทีมเดียวกัน
      const existing = await this.athleteRepo.findByCode(input.teamId, athleteCode);
      if (existing) {
        throw new Error(`Athlete code '${athleteCode}' already exists in this team.`);
      }
    }

    return await this.athleteRepo.create({
      id: crypto.randomUUID(),
      teamId: input.teamId,
      athleteCode,
      name: input.name.trim(),
      phone: input.phone || null,
      startDate: input.startDate,
      status: input.status || 'ACTIVE',
    });
  }

  async updateAthlete(id: string, input: UpdateAthleteInput, teamId?: string): Promise<Athlete> {
    const existing = await this.athleteRepo.findById(id);
    if (!existing) {
      throw new Error(`Athlete with ID ${id} not found.`);
    }

    if (input.athleteCode && input.athleteCode !== existing.athleteCode) {
      const codeOwner = await this.athleteRepo.findByCode(teamId || existing.teamId, input.athleteCode);
      if (codeOwner && codeOwner.id !== id) {
        throw new Error(`Athlete code '${input.athleteCode}' is already taken.`);
      }
    }

    const updated = await this.athleteRepo.update(id, {
      ...input,
      name: input.name?.trim(),
      athleteCode: input.athleteCode?.trim(),
      phone: input.phone !== undefined ? input.phone : undefined,
    });

    if (!updated) {
      throw new Error(`Failed to update athlete with ID ${id}.`);
    }

    return updated;
  }

  async toggleStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Athlete> {
    const updated = await this.athleteRepo.update(id, { status });
    if (!updated) {
      throw new Error(`Athlete with ID ${id} not found.`);
    }
    return updated;
  }

  async getAthletes(teamId: string, filter?: { status?: 'ACTIVE' | 'INACTIVE'; search?: string }) {
    return await this.athleteRepo.findByTeam(teamId, filter);
  }

  async getAthleteById(id: string): Promise<Athlete | null> {
    return await this.athleteRepo.findById(id);
  }
}

