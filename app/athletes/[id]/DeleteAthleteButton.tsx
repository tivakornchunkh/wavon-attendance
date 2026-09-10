'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAthleteAction } from '../../actions/athlete.actions';

interface DeleteAthleteButtonProps {
  athleteId: string;
  athleteName: string;
  athleteCode: string;
}

export default function DeleteAthleteButton({
  athleteId,
  athleteName,
  athleteCode,
}: DeleteAthleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteAthleteAction(athleteId);
      if (res.success) {
        setIsOpen(false);
        router.push('/athletes');
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการลบนักกีฬา');
        setIsDeleting(false);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 font-bold text-xs transition cursor-pointer min-h-[42px]"
      >
        <span>🗑️</span>
        <span>ลบนักกีฬา</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-3">
              ⚠️
            </div>

            <h3 className="text-base sm:text-lg font-black text-zinc-900 text-center">
              ยืนยันการลบนักกีฬา?
            </h3>

            <p className="text-xs text-zinc-500 text-center mt-2 leading-relaxed">
              คุณกำลังจะลบ <strong>&ldquo;{athleteName}&rdquo;</strong> (รหัส {athleteCode}) ออกจากระบบอย่างถาวร
              ข้อมูลสถิติและประวัติการเช็คชื่อทั้งหมดจะถูกลบไปด้วย
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
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition cursor-pointer min-h-[42px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <span>ยืนยันลบข้อมูล</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
