'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cancelSessionAction } from '../../actions/session.actions';

interface CancelSessionButtonProps {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
}

export default function CancelSessionButton({
  sessionId,
  sessionTitle,
  sessionDate,
  sessionTime,
}: CancelSessionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCancel = async () => {
    setIsCanceling(true);
    setError(null);
    try {
      const res = await cancelSessionAction(sessionId);
      if (res.success) {
        setIsOpen(false);
        router.push('/sessions');
        router.refresh();
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการยกเลิกรอบซ้อม');
        setIsCanceling(false);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setIsCanceling(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer min-h-[40px] inline-flex items-center gap-1.5"
        title="ยกเลิกรอบนี้"
      >
        <span>🗑️</span>
        <span>ยกเลิกรอบซ้อมนี้</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-3">
              ⚠️
            </div>

            <h3 className="text-base sm:text-lg font-black text-zinc-900 text-center">
              ยืนยันการยกเลิกรอบซ้อม?
            </h3>

            <p className="text-xs text-zinc-500 text-center mt-2 leading-relaxed">
              คุณกำลังจะยกเลิกรอบ <strong>&ldquo;{sessionTitle}&rdquo;</strong>
              <br />
              (วันที่ {sessionDate} เวลา {sessionTime} น.)
              <br />
              <span className="text-rose-600 font-semibold mt-1 inline-block">
                ข้อมูลการเช็คชื่อทั้งหมดในรอบนี้จะถูกลบและไม่นำมาคิดในสถิติ
              </span>
            </p>

            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-bold">
                {error}
              </div>
            )}

            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isCanceling}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition cursor-pointer min-h-[42px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCanceling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] disabled:opacity-50"
              >
                {isCanceling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังยกเลิก...</span>
                  </>
                ) : (
                  <span>ยืนยันยกเลิก</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}