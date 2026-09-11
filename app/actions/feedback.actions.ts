'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../../src/server/db/client';
import { FeedbackRepository, FeedbackRecord } from '../../src/server/repositories/feedback.repo';
import { getCurrentSession } from '../../src/server/helpers/auth';
import crypto from 'crypto';

const feedbackRepo = new FeedbackRepository(db);

// BUG-13: In-memory Rate Limiting ป้องกันการส่งสแปมซ้ำๆ
const feedbackRateLimitMap = new Map<string, number>();

function checkRateLimit(identifier: string, cooldownMs = 10000): boolean {
  const now = Date.now();
  const lastTime = feedbackRateLimitMap.get(identifier);
  if (lastTime && now - lastTime < cooldownMs) {
    return false; // ถูกจำกัดสิทธิ์ (rate limited)
  }
  feedbackRateLimitMap.set(identifier, now);
  if (feedbackRateLimitMap.size > 500) {
    for (const [key, ts] of feedbackRateLimitMap.entries()) {
      if (now - ts > 60000) feedbackRateLimitMap.delete(key);
    }
  }
  return true; // อนุญาตให้ส่งได้
}

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

    // ตรวจสอบ Rate Limit (10 วินาทีต่อผู้ใช้หรือช่องทางติดต่อ)
    const rateLimitKey = userId || data.userContact?.trim() || data.title.trim().slice(0, 20);
    if (!checkRateLimit(rateLimitKey, 10000)) {
      return {
        success: false,
        error: 'ท่านส่งข้อเสนอแนะเร็วเกินไป กรุณารอสักครู่ (10 วินาที) ก่อนส่งใหม่อีกครั้ง',
      };
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

