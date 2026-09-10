'use client';

import React, { useState, useEffect } from 'react';

interface UserGuideModalProps {
  autoOpen?: boolean;
}

export default function UserGuideModal({ autoOpen = false }: UserGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
      document.cookie = 'show_welcome_guide=; path=/; max-age=0';
    } else {
      const match = document.cookie.match(/show_welcome_guide=true/);
      if (match) {
        setIsOpen(true);
        document.cookie = 'show_welcome_guide=; path=/; max-age=0';
      }
    }
  }, [autoOpen]);

  const steps = [
    {
      step: 1,
      badge: 'ขั้นตอนที่ 1 • ระบบทะเบียนนักกีฬา',
      title: 'เพิ่มนักกีฬาเข้าสังกัดสโมสร',
      subtitle: 'สร้างรหัสนักกีฬาและจัดเก็บข้อมูลแยกสโมสร',
      icon: '🏃‍♂️',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'ไปที่เมนู "นักกีฬา" เพื่อเพิ่มรายชื่อนักกีฬา กำหนดรหัสประจำตัว (เช่น A01, A02) หรือนำเข้าเป็นชุดได้ทันที ข้อมูลทั้งหมดจะถูกแยกเป็นสัดส่วนของสโมสรคุณอย่างปลอดภัย',
      tips: '💡 คำแนะนำ: รหัสนักกีฬาจะช่วยให้นักกีฬาค้นหาชื่อตัวเองได้อย่างรวดเร็วใน 1 วินาทีตอนสแกน QR ริมสนาม',
      // Visual Mockup Card
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <span className="font-bold text-zinc-700">ตัวอย่างการ์ดนักกีฬา</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ACTIVE</span>
          </div>
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-black flex items-center justify-center text-xs">
              A07
            </div>
            <div className="flex-1">
              <p className="font-black text-zinc-900">กิตติศักดิ์ ชัยชนะ (อาร์ม)</p>
              <p className="text-[10px] text-zinc-400">เบอร์เสื้อ #10 • วินัยการเข้าซ้อม 95%</p>
            </div>
            <span className="text-emerald-600 font-bold text-xs">✓ พร้อมซ้อม</span>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      badge: 'ขั้นตอนที่ 2 • ระบบ QR ถาวร & หลายรอบต่อวัน',
      title: 'พิมพ์ป้าย QR ถาวร & ตั้งรอบซ้อม',
      subtitle: 'พิมพ์ป้าย A4 ติดริมสนามครั้งเดียว ใช้ได้ตลอดฤดูกาล',
      icon: '📌',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      description:
        'สโมสรมีป้าย QR Code ประจำสนามถาวร สามารถพิมพ์ขนาด A4 ไปติดริมสนามได้ทันที และกำหนดตารางซ้อมประจำได้หลายรอบใน 1 วัน (เช่น ซ้อมเช้า 06:00-08:00 และ ซ้อมเย็น 17:00-19:00) ระบบจะจับคู่รอบตามเวลาจริงที่สแกนให้อัตโนมัติ',
      tips: '💡 ปรับเปลี่ยนเวลาได้ตลอดเวลา: โค้ชสามารถแก้ไขเวลาหรือหัวข้อรอบซ้อมได้ทันทีโดย ไม่ต้องพิมพ์ป้าย QR ใหม่อย่างแน่นอน',
      // Visual Mockup Card
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
            <span className="font-bold text-zinc-700 flex items-center gap-1.5">
              <span>📌 ป้ายเดียวสแกนได้ทุกรอบ</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-black">MULTI-SESSION</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">รอบที่ 1: เช้า</span>
              <p className="font-black text-zinc-900 text-[11px]">🌅 06:00 - 08:00 น.</p>
              <p className="text-[9px] text-zinc-400">สแกนช่วงเช้า &rarr; เข้าซ้อมเช้า</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">รอบที่ 2: เย็น</span>
              <p className="font-black text-zinc-900 text-[11px]">🌇 17:00 - 19:00 น.</p>
              <p className="text-[9px] text-zinc-400">สแกนช่วงเย็น &rarr; เข้าซ้อมเย็น</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      badge: 'ขั้นตอนที่ 3 • สแกนเช็คชื่อริมสนาม',
      title: 'นักกีฬาสแกนเช็คชื่อ & แจ้งลาซ้อม',
      subtitle: 'สแกนผ่านกล้องมือถือหรือ LINE ใน 1 คลิก',
      icon: '📱',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      description:
        'นักกีฬามาถึงสนาม เปิดกล้องมือถือสแกนป้าย QR ประจำสนาม ค้นหาชื่อตนเอง แล้วแตะ "✓ เช็คชื่อเข้าซ้อมทันที" หากมีอาการป่วยหรือไม่สะดวก สามารถแตะแท็บ "แจ้งลาซ้อม" พร้อมระบุเหตุผลได้ทันที',
      tips: '💡 ป้องกันการโกง: มีระบบ Pitch Verification ตรวจสอบว่าสแกนจากป้ายจริงริมสนาม และมี Digital Training Pass แสดงลำดับคนที่มาถึงสนาม',
      // Visual Mockup Card
      renderIllustration: () => (
        <div className="bg-zinc-900 text-white rounded-2xl p-3.5 space-y-2 text-xs border border-zinc-800">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-[10px]">
            <span className="text-emerald-400 font-bold">🛡️ PITCH VERIFIED</span>
            <span className="text-zinc-400">1-TAP CHECK-IN</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500 text-black font-black flex items-center justify-center text-xs">✓</span>
              <div>
                <p className="font-bold text-white text-[11px]">เช็คชื่อสำเร็จ!</p>
                <p className="text-[9px] text-zinc-400">มาถึงสนามเป็นคนที่ #3 ของรอบนี้</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
              มาซ้อม
            </span>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      badge: 'ขั้นตอนที่ 4 • ระบบตัดยอดอัตโนมัติ',
      title: 'ตัดยอดขาดอัตโนมัติ & ตรวจสอบย้อนหลัง',
      subtitle: 'หมดเวลาซ้อมระบบบันทึกขาดให้อัตโนมัติ',
      icon: '⏱️',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      description:
        'เมื่อถึงเวลาสิ้นสุดการซ้อม ระบบจะทำการตัดยอดนักกีฬาที่ยังไม่ได้สแกนและไม่ได้แจ้งลา ให้เป็น "ขาด (ABSENT)" อัตโนมัติทันที โค้ชสามารถเข้ามาตรวจสอบ แก้ไขย้อนหลังได้ตลอดเวลา และระบบมี Audit Logs บันทึกความโปร่งใส',
      tips: '💡 โค้ชไม่ต้องกังวลเรื่องลืมกดปิดรอบ: ระบบทำงานบนคลาวด์แบบ Auto-Closing ตามเวลาจริงประเทศไทย (GMT+7)',
      // Visual Mockup Card
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[10px] font-bold pb-1 border-b border-zinc-200">
            <span className="text-zinc-500 uppercase">AUTO-CUTOFF ENGINE</span>
            <span className="text-rose-700">19:00 น. หมดเวลา</span>
          </div>
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-zinc-200">
            <div className="space-y-0.5">
              <p className="font-bold text-zinc-800 text-[11px]">ตัดยอดขาดซ้อมอัตโนมัติ</p>
              <p className="text-[10px] text-zinc-400">นักกีฬา 2 คนที่ไม่ได้มาสแกน &rarr; บันทึกเป็นขาด</p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
              ABSENT
            </span>
          </div>
        </div>
      ),
    },
    {
      step: 5,
      badge: 'ขั้นตอนที่ 5 • แดชบอร์ด & ดัชนีความพร้อม',
      title: 'แดชบอร์ดสถิติ & สรุปผลความพร้อม',
      subtitle: 'ประเมินวินัยสโมสร และส่งออกรายงาน Excel',
      icon: '📊',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'หน้าแดชบอร์ดสรุปสถิติความสม่ำเสมอรวม มีระบบแท็บ 3 มิติสำหรับมือถือ (ภาพรวม, อันดับวินัย, รายชื่อนักกีฬา) พร้อมการประเมินดัชนีความพร้อมสโมสร (Club Readiness Grade A/B+/B/C/D) และกดส่งออกรายงาน Excel ได้ในคลิกเดียว',
      tips: '💡 ใช้งานสะดวกทั้งบนมือถือและคอมพิวเตอร์: โค้ชสามารถเปิดดูสรุปหน้างานบนมือถือได้อย่างคล่องตัว',
      // Visual Mockup Card
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-200">
            <span className="font-bold text-zinc-700">CLUB READINESS INDEX</span>
            <span className="text-[10px] font-mono text-zinc-400">READY</span>
          </div>
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-zinc-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-lg">
              A
            </div>
            <div className="flex-1">
              <p className="font-bold text-zinc-900 text-xs">ยอดเยี่ยม (High-Performance)</p>
              <p className="text-[10px] text-zinc-500">ความสม่ำเสมอรวม 92% • พร้อมแข่งขัน</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setCurrentStep(0);
          setIsOpen(true);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
        title="เปิดดูคู่มือการใช้งานระบบ"
      >
        <span>❓</span>
        <span>คู่มือการใช้งานระบบ</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 flex flex-col justify-between min-h-[540px] max-h-[92vh] overflow-y-auto">
            {/* Top Step Header */}
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${current.color}`}>
                  {current.badge}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer text-sm transition"
                >
                  ✕
                </button>
              </div>

              {/* Step Title & Icon */}
              <div className="mt-4 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-2xl shadow-md shrink-0 ring-4 ring-zinc-100">
                  {current.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 leading-tight">
                    {current.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {current.subtitle}
                  </p>
                </div>
              </div>

              {/* Visual Mockup Card Illustration */}
              <div className="mt-4">
                {current.renderIllustration()}
              </div>

              {/* Description Body */}
              <p className="mt-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {current.description}
              </p>

              {/* Tips Box */}
              <div className="mt-3.5 p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-[11px] text-zinc-600 leading-relaxed font-medium">
                {current.tips}
              </div>
            </div>

            {/* Bottom Step Indicator & Controls */}
            <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
              {/* Dots Progress */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentStep ? 'w-6 bg-emerald-600' : 'w-2 bg-zinc-200 hover:bg-zinc-300'
                    }`}
                    title={`ไปยังขั้นตอนที่ ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Nav Buttons */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition cursor-pointer min-h-[38px]"
                  >
                    &larr; ก่อนหน้า
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer min-h-[38px] active:scale-95"
                >
                  <span>{currentStep === steps.length - 1 ? 'เริ่มต้นใช้งานทันที ✓' : 'ถัดไป &rarr;'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}