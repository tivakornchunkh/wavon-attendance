'use client';

import { useState } from 'react';
import { APP_VERSION } from '../src/version';
import { submitFeedbackAction } from '../app/actions/feedback.actions';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [issueType, setIssueType] = useState<'BUG' | 'FEATURE' | 'PERFORMANCE' | 'OTHER'>('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [userContact, setUserContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setSteps('');
    setUserContact('');
    setIsSubmitted(false);
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim() || !description.trim()) {
      setErrorMessage('กรุณาระบุหัวข้อและรายละเอียด');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullDescription =
        issueType === 'BUG' && steps.trim()
          ? `${description.trim()}\n\n[ขั้นตอนการจำลองปัญหา]:\n${steps.trim()}`
          : description.trim();

      const deviceInfo = `App: ${APP_VERSION} | URL: ${
        typeof window !== 'undefined' ? window.location.pathname : 'N/A'
      } | UA: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'} | Time: ${new Date().toLocaleString(
        'th-TH',
        { timeZone: 'Asia/Bangkok' }
      )}`;

      const res = await submitFeedbackAction({
        category: issueType,
        title: title.trim(),
        description: fullDescription,
        userContact: userContact.trim() || undefined,
        deviceInfo,
      });

      if (res.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGitHub = () => {
    const typeLabel =
      issueType === 'BUG'
        ? '[Bug Report 🐞]'
        : issueType === 'FEATURE'
        ? '[Feature Request 💡]'
        : issueType === 'PERFORMANCE'
        ? '[Performance ⚡]'
        : '[Feedback 💬]';

    const fullTitle = `${typeLabel} ${title.trim() || 'รายงานปัญหาการใช้งาน'}`;
    const issueBody = `### 📌 ประเภท: ${issueType}\n\n### 📝 รายละเอียด:\n${description}\n\n### 🛠️ ระบบ: ${APP_VERSION}`;
    const ghUrl = `https://github.com/tivakornchunkh/wavon-attendance/issues/new?title=${encodeURIComponent(
      fullTitle
    )}&body=${encodeURIComponent(issueBody)}`;
    window.open(ghUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-zinc-200 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto overscroll-contain">
        {/* Grab Handle for Mobile */}
        <div className="sm:hidden w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mb-3" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
              💬
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-zinc-900">
                แจ้งปัญหา & เสนอแนะฟีเจอร์
              </h3>
              <p className="text-[11px] text-zinc-500">ส่งตรงถึงผู้พัฒนาโดยตรง ไม่ต้องมี GitHub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Success State */}
        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-xs animate-in zoom-in-50">
              ✓
            </div>
            <h4 className="text-base font-black text-zinc-900">ได้รับข้อมูลเรียบร้อยแล้ว!</h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              ขอบคุณสำหรับข้อเสนอแนะและรายงานปัญหา ข้อมูลถูกส่งตรงถึงผู้พัฒนาแล้ว และจะได้รับการตรวจสอบอย่างเร็วที่สุดครับ
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Issue Type Selector */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1.5">เลือกประเภทรายงาน</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIssueType('BUG')}
                  className={`py-2 px-2 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    issueType === 'BUG'
                      ? 'border-rose-400 bg-rose-50/80 text-rose-800 shadow-xs'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-base">🐞</span>
                  <span className="text-[11px]">พบข้อผิดพลาด</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIssueType('FEATURE')}
                  className={`py-2 px-2 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    issueType === 'FEATURE'
                      ? 'border-amber-400 bg-amber-50/80 text-amber-800 shadow-xs'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-base">💡</span>
                  <span className="text-[11px]">เสนอฟีเจอร์</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIssueType('PERFORMANCE')}
                  className={`py-2 px-2 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                    issueType === 'PERFORMANCE'
                      ? 'border-emerald-400 bg-emerald-50/80 text-emerald-800 shadow-xs'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-base">⚡</span>
                  <span className="text-[11px]">ความเร็วระบบ</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                หัวข้อเรื่อง <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น สแกน QR แล้วขึ้นอยู่นอกเวลา, ปุ่มบันทึกกดไม่ติด..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                รายละเอียด <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายสิ่งที่เกิดขึ้น หรือฟังก์ชันที่อยากให้ระบบมีเพิ่มเติม..."
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400 resize-none"
              />
            </div>

            {/* Steps (only for bug) */}
            {issueType === 'BUG' && (
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  ขั้นตอนที่ทำให้เกิดปัญหา (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="เช่น 1. เข้าหน้ารอบซ้อม 2. กดปุ่มยกเลิก แล้วหน้าจอหมุนค้าง..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400 resize-none"
                />
              </div>
            )}

            {/* Contact (Optional) */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                ช่องทางติดต่อกลับ (เบอร์โทร หรือ LINE ID - ไม่บังคับ)
              </label>
              <input
                type="text"
                value={userContact}
                onChange={(e) => setUserContact(e.target.value)}
                placeholder="เผื่อทีมงานต้องการสอบถามรายละเอียดเพิ่มเติม"
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
              />
            </div>

            {/* Auto diagnostic box */}
            <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-500 space-y-0.5">
              <p className="font-bold text-zinc-700 flex items-center gap-1">
                <span>🛡️</span>
                <span>ระบบแนบเวอร์ชัน ({APP_VERSION}) และข้อมูลอุปกรณ์อัตโนมัติ</span>
              </p>
              <p className="text-[10px] text-zinc-400">
                ข้อมูลจะถูกส่งเข้าสู่ระบบฐานข้อมูลของผู้พัฒนาโดยตรงอย่างปลอดภัย
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังส่งข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <span>📨</span>
                    <span>ส่งรายงานปัญหาทันที</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenGitHub}
                className="w-full py-2 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 transition text-center cursor-pointer"
              >
                หรือส่งผ่าน GitHub Issues (สำหรับ Developer) →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}