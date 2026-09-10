'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../../src/server/db/client';
import { FeedbackRepository, FeedbackRecord } from '../../src/server/repositories/feedback.repo';
import { getCurrentSession } from '../../src/server/helpers/auth';
import crypto from 'crypto';

const feedbackRepo = new FeedbackRepository(db);

export async function submitFeedbackAction(data: {
  category: 'BUG' | 'FEATURE' | 'PERFORMANCE' | 'OTHER';
  title: string;
  description: string;
  userContact?: string;
  deviceInfo?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.title?.trim() || !data.description?.trim()) {
      return { success: false, error: 'กรุณาระบุหัวข้อและรายละเอียด' };
    }

    let userId: string | null = null;
    let userName: string | null = null;

    try {
      const session = await getCurrentSession();
      if (session?.user) {
        userId = session.user.id;
        userName = `${session.user.name} (@${session.user.username})`;
      }
    } catch {
      // User might be public or not logged in
    }

    const id = `fb_${crypto.randomUUID()}`;

    await feedbackRepo.create({
      id,
      userId,
      userName,
      userContact: data.userContact?.trim() || null,
      category: data.category || 'BUG',
      title: data.title.trim(),
      description: data.description.trim(),
      deviceInfo: data.deviceInfo || null,
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error submitting feedback:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง',
    };
  }
}

export async function getFeedbacksAction(): Promise<FeedbackRecord[]> {
  try {
    const session = await getCurrentSession();
    if (!session.isAdmin) {
      throw new Error('Unauthorized');
    }
    return await feedbackRepo.findAll();
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    return [];
  }
}

export async function updateFeedbackStatusAction(
  id: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isAdmin) {
      return { success: false, error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้น' };
    }

    const ok = await feedbackRepo.updateStatus(id, status);
    if (!ok) {
      return { success: false, error: 'ไม่พบรายการที่ต้องการอัปเดต' };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตสถานะ',
    };
  }
}

export async function deleteFeedbackAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isAdmin) {
      return { success: false, error: 'Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้น' };
    }

    const ok = await feedbackRepo.delete(id);
    if (!ok) {
      return { success: false, error: 'ไม่พบรายการที่ต้องการลบ' };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบรายการ',
    };
  }
}
