'use client';

import React, { useState, useEffect } from 'react';

interface UserGuideModalProps {
  autoOpen?: boolean;
}

export default function UserGuideModal({ autoOpen = false }: UserGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if auto-open requested via prop or cookie
    if (autoOpen) {
      setIsOpen(true);
      // Remove welcome cookie
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
      badge: 'ขั้นตอนที่ 1',
      title: 'เพิ่มนักกีฬาเข้าสังกัดสโมสร',
      subtitle: 'สร้างทะเบียนนักกีฬาของทีมคุณ',
      icon: '🏃‍♂️',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description:
        'ไปที่เมนู "นักกีฬา" เพื่อเพิ่มรายชื่อนักกีฬา กำหนดเบอร์เสื้อ ตำแหน่ง และชื่อเล่น หรือนำเข้าเป็นชุดได้ทันที ข้อมูลทั้งหมดจะถูกแยกเป็นสัดส่วนของสโมสรคุณอย่างปลอดภัย',
      tips: '💡 คำแนะนำ: ใส่ชื่อเล่นและเบอร์เสื้อ เพื่อให้นักกีฬาค้นหาชื่อตัวเองได้รวดเร็วตอนสแกน QR',
    },
    {
      step: 2,
      badge: 'ขั้นตอนที่ 2',
      title: 'เปิดรอบฝึกซ้อมด่วนใน 1 คลิก',
      subtitle: 'วางแผนตารางซ้อม หรือเปิดรอบซ้อมทันที',
      icon: '⏱️',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      description:
        'ไปที่เมนู "รอบซ้อม & เช็คชื่อ" แล้วกดปุ่ม "⚡ เปิดรอบซ้อมด่วนทันที" ระบบจะสร้างรอบซ้อมของวันนี้และดึงรายชื่อนักกีฬาทุกคนในสโมสรมาเตรียมพร้อมเช็คชื่อให้อัตโนมัติ',
      tips: '💡 คำแนะนำ: สามารถระบุเวลาเริ่มต้น-สิ้นสุด และหัวข้อการฝึกซ้อม เช่น "ซ้อมยิงประตู", "Fitness" ได้',
    },
    {
      step: 3,
      badge: 'ขั้นตอนที่ 3',
      title: 'สแกน QR Code & แจ้งลาซ้อมริมสนาม',
      subtitle: 'เช็คชื่ออัตโนมัติ ไม่ต้องมีบัญชี ไม่ต้องโหลดแอป',
      icon: '📱',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      description:
        'ในหน้ารอบซ้อม กดปุ่ม "📱 QR Code เช็คชื่อ" เพื่อเปิดคิวอาร์โค้ดขึ้นหน้าจอ หรือตั้ง iPad แบบเต็มจอริมสนาม ให้นักกีฬาสแกนด้วยกล้องมือถือ/LINE แล้วแตะชื่อตนเองเพื่อ "✓ เข้าซ้อม" หรือ "⚠ แจ้งลาซ้อมพร้อมเหตุผล"',
      tips: '💡 คำแนะนำ: มีปุ่ม "📋 คัดลอกลิงก์ส่ง LINE" ให้โค้ชส่งเข้ากลุ่มไลน์ผู้ปกครองหรือนักกีฬาได้ล่วงหน้า',
    },
    {
      step: 4,
      badge: 'ขั้นตอนที่ 4',
      title: 'สรุปแดชบอร์ดสถิติ & ดาวน์โหลด Excel',
      subtitle: 'ติดตามความสม่ำเสมอและประเมินผลการฝึกซ้อม',
      icon: '📊',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      description:
        'กลับมาที่หน้า "แดชบอร์ด" เพื่อดูสถิติอัตราการเข้าซ้อมโดยรวม (Attendance Rate) กราฟเปรียบเทียบแนวโน้ม และกดปุ่มส่งออกรายงานเป็นไฟล์ Excel / CSV เพื่อนำไปใช้ประชุมหรือรายงานผู้ปกครองได้ทันที',
      tips: '💡 คำแนะนำ: บันทึกการแก้ไขสถานะย้อนหลังจะถูกจัดเก็บใน Audit Logs โดยอัตโนมัติเพื่อความโปร่งใส',
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
      {/* Trigger Button (placed in header/sidebar) */}
      <button
        type="button"
        onClick={() => {
          setCurrentStep(0);
          setIsOpen(true);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
        title="เปิดดูวิธีใช้งานระบบ"
      >
        <span>❓</span>
        <span>คู่มือการใช้งานระบบ</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col justify-between min-h-[480px]">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${current.color}`}>
                  {current.badge}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Graphic Hero */}
              <div className="mt-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
                  {current.icon}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900 leading-tight">
                    {current.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {current.subtitle}
                  </p>
                </div>
              </div>

              {/* Body Description */}
              <p className="mt-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {current.description}
              </p>

              {/* Tip Box */}
              <div className="mt-4 p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs text-zinc-700 font-medium">
                {current.tips}
              </div>
            </div>

            {/* Step Dots & Navigation Footer */}
            <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center justify-between gap-3">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentStep === idx ? 'w-6 bg-zinc-900' : 'w-2 bg-zinc-300'
                    }`}
                    aria-label={`ไปยังขั้นตอนที่ ${s.step}`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition cursor-pointer min-h-[42px]"
                  >
                    ย้อนกลับ
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer min-h-[42px] flex items-center gap-1.5"
                >
                  <span>{currentStep === steps.length - 1 ? '🚀 เริ่มใช้งานเลย' : 'ถัดไป →'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}