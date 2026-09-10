'use client';

import { useState } from 'react';
import { APP_VERSION } from '../src/version';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [issueType, setIssueType] = useState<'bug' | 'feature' | 'perf'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const typePrefix =
    issueType === 'bug'
      ? '[Bug Report 🐞]'
      : issueType === 'feature'
      ? '[Feature Request 💡]'
      : '[Performance ⚡]';

  const fullTitle = `${typePrefix} ${title.trim() || 'รายงานปัญหาการใช้งาน'}`;

  const issueBody = `### 📌 ประเภทรายงาน
${
  issueType === 'bug'
    ? '🐞 บัค / ข้อผิดพลาดของระบบ'
    : issueType === 'feature'
    ? '💡 ข้อเสนอแนะฟีเจอร์ใหม่'
    : '⚡ ประสิทธิภาพ / ความเร็วระบบ'
}

### 📝 รายละเอียด
${description.trim() || 'ไม่ได้ระบุ'}

${
  issueType === 'bug'
    ? `### 🔁 ขั้นตอนที่ทำให้เกิดปัญหา (Steps to Reproduce)
${steps.trim() || 'ไม่ได้ระบุ'}`
    : ''
}

---
### 🛠️ ข้อมูลระบบอัตโนมัติ (Diagnostics)
- **App Version:** ${APP_VERSION}
- **URL ที่พบ:** ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
- **เบราว์เซอร์ / อุปกรณ์:** ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
- **เวลาที่รายงาน:** ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} (เวลาประเทศไทย)
`;

  const handleOpenGitHub = () => {
    const ghUrl = `https://github.com/tivakornchunkh/wavon-attendance/issues/new?title=${encodeURIComponent(
      fullTitle
    )}&body=${encodeURIComponent(issueBody)}`;
    window.open(ghUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${fullTitle}\n\n${issueBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto touch-scroll">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐞</span>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                รายงานปัญหา / ข้อเสนอแนะ
              </h3>
              <p className="text-[11px] text-zinc-500">ส่งข้อมูลตรงเข้าสู่ GitHub Issues ของผู้พัฒนา</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleOpenGitHub();
          }}
          className="mt-4 space-y-4 text-xs"
        >
          {/* Issue Type Selector */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1.5">ประเภทรายงาน</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIssueType('bug')}
                className={`py-2 px-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                  issueType === 'bug'
                    ? 'border-rose-400 bg-rose-50/80 text-rose-800 shadow-xs'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>🐞</span>
                <span className="text-[11px]">รายงานบัค</span>
              </button>

              <button
                type="button"
                onClick={() => setIssueType('feature')}
                className={`py-2 px-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                  issueType === 'feature'
                    ? 'border-amber-400 bg-amber-50/80 text-amber-800 shadow-xs'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>💡</span>
                <span className="text-[11px]">เสนอแนะฟีเจอร์</span>
              </button>

              <button
                type="button"
                onClick={() => setIssueType('perf')}
                className={`py-2 px-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                  issueType === 'perf'
                    ? 'border-emerald-400 bg-emerald-50/80 text-emerald-800 shadow-xs'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span>⚡</span>
                <span className="text-[11px]">ความเร็ว / โหลด</span>
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
              placeholder="เช่น สแกน QR แล้วขึ้นอยู่นอกเวลา, หน้าแดชบอร์ดโหลดช้า..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-zinc-700 mb-1">
              รายละเอียดของปัญหา <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุสิ่งที่พบ และสิ่งที่คาดหวังให้เกิดขึ้น..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400 resize-none"
            />
          </div>

          {/* Steps to reproduce (only for bug) */}
          {issueType === 'bug' && (
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                ขั้นตอนที่ทำให้เกิดปัญหา (ถ้ามี)
              </label>
              <textarea
                rows={2}
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. กดปุ่มสร้างรอบด่วน&#10;2. สแกน QR Code แล้วขึ้นแจ้งเตือน..."
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400 resize-none"
              />
            </div>
          )}

          {/* Auto diagnostic box */}
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-500 space-y-1">
            <p className="font-bold text-zinc-700 flex items-center gap-1">
              <span>🛡️</span>
              <span>ระบบแนบข้อมูลเวอร์ชัน ({APP_VERSION}) และเวลาอัตโนมัติ</span>
            </p>
            <p className="text-[10px] text-zinc-400">
              ช่วยให้นักพัฒนาจำลองและตรวจสอบปัญหาได้รวดเร็วขึ้น
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 font-bold text-zinc-700 transition cursor-pointer min-h-[42px] flex items-center gap-1 shrink-0"
              title="คัดลอกข้อความรายงานไว้ในคลิปบอร์ด"
            >
              <span>{copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก'}</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] shadow-sm"
            >
              <span>🚀</span>
              <span>เปิดส่งบน GitHub Issues</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}