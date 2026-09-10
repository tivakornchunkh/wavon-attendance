import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { DatabaseInstance } from '../db/client';
import { trainingSessions, attendances, attendanceLogs } from '../db/schema';
import { TrainingSession } from '../../core/domain/session';

export class SessionRepository {
  constructor(private db: DatabaseInstance) {}

  async create(data: {
    id: string;
    teamId: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    createdBy: string;
  }): Promise<TrainingSession> {
    const [created] = await this.db.insert(trainingSessions).values(data).returning();
    return created as TrainingSession;
  }

  async findById(id: string): Promise<TrainingSession | null> {
    const result = await this.db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.id, id))
      .limit(1);
    return (result[0] as TrainingSession) || null;
  }

  async findByTeam(teamId: string, limit = 50): Promise<TrainingSession[]> {
    const results = await this.db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.id, teamId))
      .orderBy(desc(trainingSessions.date), desc(trainingSessions.startTime))
      .limit(limit);
    return results as TrainingSession[];
  }

  async findByDateRange(
    teamId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TrainingSession[]> {
    const conditions = [eq(trainingSessions.teamId, teamId)];

    if (startDate) {
      conditions.push(gte(trainingSessions.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(trainingSessions.date, endDate));
    }

    const results = await this.db
      .select()
      .from(trainingSessions)
      .where(and(...conditions))
      .orderBy(desc(trainingSessions.date), desc(trainingSessions.startTime));

    return results as TrainingSession[];
  }

  async findByDate(teamId: string, date: string): Promise<TrainingSession[]> {
    const results = await this.db
      .select()
      .from(trainingSessions)
      .where(and(eq(trainingSessions.teamId, teamId), eq(trainingSessions.date, date)))
      .orderBy(trainingSessions.startTime);
    return results as TrainingSession[];
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.delete(attendanceLogs).where(eq(attendanceLogs.sessionId, id));
      await this.db.delete(attendances).where(eq(attendances.sessionId, id));
    } catch (err) {
      console.warn('Cascade delete session attendances warning:', err);
    }
    const deleted = await this.db
      .delete(trainingSessions)
      .where(eq(trainingSessions.id, id))
      .returning();
    return deleted.length > 0;
  }

  async countByTeam(teamId: string, startDate?: string, endDate?: string): Promise<number> {
    const list = await this.findByDateRange(teamId, startDate, endDate);
    return list.length;
  }
}

