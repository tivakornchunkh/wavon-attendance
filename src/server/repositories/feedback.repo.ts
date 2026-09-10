import { eq, desc } from 'drizzle-orm';
import { DatabaseInstance } from '../db/client';
import { feedbacks } from '../db/schema';

export interface FeedbackRecord {
  id: string;
  userId: string | null;
  userName: string | null;
  userContact: string | null;
  category: 'BUG' | 'FEATURE' | 'PERFORMANCE' | 'OTHER';
  title: string;
  description: string;
  deviceInfo: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export class FeedbackRepository {
  constructor(private db: DatabaseInstance) {}

  async create(data: {
    id: string;
    userId?: string | null;
    userName?: string | null;
    userContact?: string | null;
    category: 'BUG' | 'FEATURE' | 'PERFORMANCE' | 'OTHER';
    title: string;
    description: string;
    deviceInfo?: string | null;
  }): Promise<FeedbackRecord> {
    const [created] = await this.db.insert(feedbacks).values(data).returning();
    return created as FeedbackRecord;
  }

  async findAll(): Promise<FeedbackRecord[]> {
    const results = await this.db
      .select()
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt));
    return results as FeedbackRecord[];
  }

  async updateStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'): Promise<boolean> {
    const updated = await this.db
      .update(feedbacks)
      .set({ status })
      .where(eq(feedbacks.id, id))
      .returning();
    return updated.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(feedbacks)
      .where(eq(feedbacks.id, id))
      .returning();
    return deleted.length > 0;
  }
}

