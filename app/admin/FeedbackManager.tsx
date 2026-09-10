'use client';

import { useState, useTransition } from 'react';
import { updateFeedbackStatusAction, deleteFeedbackAction } from '../actions/feedback.actions';
import { FeedbackRecord } from '../../src/server/repositories/feedback.repo';

interface FeedbackManagerProps {
  initialFeedbacks: FeedbackRecord[];
}

export default function FeedbackManager({ initialFeedbacks }: FeedbackManagerProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>(initialFeedbacks);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterCategory === 'ALL') return true;
    return f.category === filterCategory;
  });

  const handleUpdateStatus = (id: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => {
    startTransition(async () => {
      const res = await updateFeedbackStatusAction(id, newStatus);
      if (res.success) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        );
        if (selectedFeedback?.id === id) {
          setSelectedFeedback((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        alert(res.error || 'เกิดข้อผิดพลาดในการอัปเดต');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;

    startTransition(async () => {
      const res = await deleteFeedbackAction(id);
      if (res.success) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        if (selectedFeedback?.id === id) {
          setSelectedFeedback(null);
        }
      } else {
        alert(res.error || 'เกิดข้อผิดพลาดในการลบ');
      }
    });
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'BUG':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <span>🐞</span>
            <span>บัค / ผิดพลาด</span>
          </span>
        );
      case 'FEATURE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span>💡</span>
            <span>ฟีเจอร์</span>
          </span>
        );
      case 'PERFORMANCE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span>⚡</span>
            <span>ความเร็ว</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1">
            <span>💬</span>
            <span>ทั่วไป</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ แก้ไขแล้ว
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ⏳ กำลังดำเนินการ
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
            ● รอดำเนินการ
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📨</span>
          <div>
            <h2 className="text-base font-black text-zinc-900">
              รายการแจ้งปัญหาและข้อเสนอแนะ ({feedbacks.length})
            </h2>
            <p className="text-[11px] text-zinc-500">
              ข้อมูลที่ผู้ใช้งาน, โค้ช หรือนักกีฬารายงานเข้ามาจากในระบบ
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {['ALL', 'BUG', 'FEATURE', 'PERFORMANCE'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                filterCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              {cat === 'ALL'
                ? 'ทั้งหมด'
                : cat === 'BUG'
                ? '🐞 บัค'
                : cat === 'FEATURE'
                ? '💡 ฟีเจอร์'
                : '⚡ ความเร็ว'}
            </button>
          ))}
        </div>
      </div>

      {/* Feedbacks List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="py-12 text-center text-zinc-400 space-y-2">
          <span className="text-3xl block">📭</span>
          <p className="text-xs font-medium">ยังไม่มีรายการแจ้งปัญหาหรือข้อเสนอแนะในหมวดหมู่นี้</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 space-y-0">
          {filteredFeedbacks.map((item) => (
            <div
              key={item.id}
              className="py-3.5 hover:bg-zinc-50/80 px-2 -mx-2 rounded-xl transition space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(item.category)}
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {item.createdAt}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900">
                    {item.title}
                  </h4>
                </div>

                {/* Status Switcher & Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={item.status}
                    disabled={isPending}
                    onChange={(e) =>
                      handleUpdateStatus(
                        item.id,
                        e.target.value as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
                      )
                    }
                    className="text-[11px] font-bold py-1 px-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 cursor-pointer focus:outline-hidden"
                  >
                    <option value="PENDING">รอดำเนินการ</option>
                    <option value="IN_PROGRESS">กำลังแก้ไข</option>
                    <option value="RESOLVED">แก้ไขแล้ว</option>
                  </select>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-xs"
                    title="ลบรายการนี้"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Description preview */}
              <p className="text-xs text-zinc-600 whitespace-pre-line bg-zinc-50 p-3 rounded-xl border border-zinc-100 font-sans leading-relaxed">
                {item.description}
              </p>

              {/* Metadata row */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <span>ผู้ส่ง: <strong className="text-zinc-700">{item.userName || 'ผู้ใช้งานทั่วไป'}</strong></span>
                  {item.userContact && (
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                      📞 {item.userContact}
                    </span>
                  )}
                </div>

                {item.deviceInfo && (
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-xs" title={item.deviceInfo}>
                    {item.deviceInfo.split('|')[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

