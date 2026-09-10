import { eq, and, like, lte, or, desc } from 'drizzle-orm';
import { DatabaseInstance } from '../db/client';
import { athletes, attendances, attendanceLogs } from '../db/schema';
import { Athlete } from '../../core/domain/athlete';

export class AthleteRepository {
  constructor(private db: DatabaseInstance) {}

  async create(data: {
    id: string;
    teamId: string;
    athleteCode: string;
    name: string;
    phone?: string | null;
    startDate: string;
    status: 'ACTIVE' | 'INACTIVE';
  }): Promise<Athlete> {
    const [created] = await this.db.insert(athletes).values(data).returning();
    return created as Athlete;
  }

  async findById(id: string): Promise<Athlete | null> {
    const result = await this.db.select().from(athletes).where(eq(athletes.id, id)).limit(1);
    return (result[0] as Athlete) || null;
  }

  async findByCode(teamId: string, athleteCode: string): Promise<Athlete | null> {
    const result = await this.db
      .select()
      .from(athletes)
      .where(and(eq(athletes.teamId, teamId), eq(athletes.athleteCode, athleteCode)))
      .limit(1);
    return (result[0] as Athlete) || null;
  }

  async findByTeam(
    teamId: string,
    filter?: { status?: 'ACTIVE' | 'INACTIVE'; search?: string }
  ): Promise<Athlete[]> {
    const conditions = [eq(athletes.teamId, teamId)];

    if (filter?.status) {
      conditions.push(eq(athletes.status, filter.status));
    }

    if (filter?.search) {
      const searchPattern = `%${filter.search}%`;
      conditions.push(or(like(athletes.name, searchPattern), like(athletes.athleteCode, searchPattern))!);
    }

    const results = await this.db
      .select()
      .from(athletes)
      .where(and(...conditions))
      .orderBy(desc(athletes.createdAt));

    return results as Athlete[];
  }

  /**
   * ดึงรายชื่อนักกีฬาที่มีสิทธิ์เข้าซ้อมในวันที่กำหนด
   * เงื่อนไข: status = 'ACTIVE' และ start_date <= sessionDate
   */
  async findEligibleForSession(teamId: string, sessionDate: string): Promise<Athlete[]> {
    const results = await this.db
      .select()
      .from(athletes)
      .where(
        and(
          eq(athletes.teamId, teamId),
          eq(athletes.status, 'ACTIVE'),
          lte(athletes.startDate, sessionDate)
        )
      )
      .orderBy(athletes.athleteCode);

    return results as Athlete[];
  }

  async update(
    id: string,
    data: Partial<{
      athleteCode: string;
      name: string;
      phone: string | null;
      startDate: string;
      status: 'ACTIVE' | 'INACTIVE';
      updatedAt: string;
    }>
  ): Promise<Athlete | null> {
    const [updated] = await this.db
      .update(athletes)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(athletes.id, id))
      .returning();

    return (updated as Athlete) || null;
  }

  async countByTeam(teamId: string): Promise<number> {
    const list = await this.db.select().from(athletes).where(eq(athletes.teamId, teamId));
    return list.length;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.delete(attendanceLogs).where(eq(attendanceLogs.athleteId, id));
      await this.db.delete(attendances).where(eq(attendances.athleteId, id));
    } catch {}
    await this.db.delete(athletes).where(eq(athletes.id, id));
    return true;
  }
}

