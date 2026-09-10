'use client';

import React, { useState, useEffect } from 'react';

interface UserGuideModalProps {
  autoOpen?: boolean;
}

export default function UserGuideModal({ autoOpen = false }: UserGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<'stepper' | 'summary'>('stepper');

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
      tabTitle: '1. รายชื่อนักกีฬา',
      badge: 'ฟังก์ชันที่ 1 • จัดการรายชื่อ',
      title: 'รายชื่อนักกีฬาในสโมสร',
      subtitle: 'เพิ่มรายชื่อ กำหนดรหัสประจำตัว แยกข้อมูลสโมสรชัดเจน',
      icon: '🏃‍♂️',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      actionSteps: [
        'กดเมนู "นักกีฬา" บนแถบเมนู',
        'เลือก "ทีละคน" หรือแท็บ "นำเข้าเป็นชุด" แล้วคัดลอกรายชื่อจาก LINE/Excel มาวางเพิ่มได้ทันที',
        'ระบบจะแยกแยะชื่อ เบอร์เสื้อ รหัสให้อัตโนมัติ พร้อม Pop-up ขวาบนแจ้งผลการบันทึก',
      ],
      quickTip: '📌 สะดวก รวดเร็ว: วางรายชื่อ 20-30 คนในช่องเดียว ระบบตรวจนับและเพิ่มเข้าสโมสรใน 1 คลิก!',
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
            <span className="font-bold text-zinc-700 flex items-center gap-1.5">
              <span>📋 ตัวอย่างรายชื่อในระบบ</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              สถานะ: ปกติ (ACTIVE)
            </span>
          </div>
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-black flex items-center justify-center text-xs shrink-0">
              A07
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-zinc-900 truncate">กิตติศักดิ์ ชัยชนะ (อาร์ม)</p>
              <p className="text-[10px] text-zinc-500">เบอร์เสื้อ #10 • วินัยการเข้าซ้อม 95%</p>
            </div>
            <span className="text-emerald-700 font-black text-[11px] shrink-0 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              ✓ พร้อมซ้อม
            </span>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      tabTitle: '2. ป้าย QR & รอบซ้อม',
      badge: 'ฟังก์ชันที่ 2 • QR ถาวร & ตารางซ้อม',
      title: 'ป้าย QR ประจำสนาม & รอบซ้อม',
      subtitle: 'พิมพ์ป้าย A4 ติดสนามครั้งเดียว ใช้ได้ตลอดฤดูกาล ไม่ต้องปรินต์ซ้ำ',
      icon: '📌',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      actionSteps: [
        'กดเมนู "รอบซ้อม" &rarr; แตะ "พิมพ์ป้าย QR สนาม (A4)" นำไปติดที่ป้ายหรือผนังสนาม',
        'ตั้งตารางซ้อมประจำได้หลายรอบต่อวัน (เช่น ซ้อมเช้า 06:00-08:00 และ ซ้อมเย็น 17:00-19:00)',
        'แก้ไขวัน-เวลาซ้อมได้ทันทีโดย ไม่ต้องพิมพ์หรือเปลี่ยนป้าย QR ใหม่ (นักกีฬาสแกน QR เดิมได้เสมอ)',
      ],
      quickTip: '🛡️ ปลอดภัย: มีปุ่ม "รีเซ็ต QR ใหม่" กรณีต้องการยกเลิกป้ายเก่าทันที',
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
            <span className="font-bold text-zinc-700 flex items-center gap-1.5">
              <span>🖨️ 1 ป้าย QR สแกนได้ทุกรอบซ้อม</span>
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              ไม่ต้องเปลี่ยนป้าย
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">รอบที่ 1: เช้า</span>
              <p className="font-black text-zinc-900 text-xs">🌅 06:00 - 08:00 น.</p>
              <p className="text-[10px] text-zinc-500">สแกนช่วงเช้า &rarr; เข้าซ้อมเช้า</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">รอบที่ 2: เย็น</span>
              <p className="font-black text-zinc-900 text-xs">🌇 17:00 - 19:00 น.</p>
              <p className="text-[10px] text-zinc-500">สแกนช่วงเย็น &rarr; เข้าซ้อมเย็น</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      tabTitle: '3. สแกนเช็คชื่อ',
      badge: 'ฟังก์ชันที่ 3 • สแกนหน้าสนาม',
      title: 'นักกีฬาสแกนเช็คชื่อ & แจ้งลา',
      subtitle: 'เปิดกล้องมือถือสแกนป้ายสนาม แตะเช็คชื่อใน 1 วินาที',
      icon: '📱',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      actionSteps: [
        'นักกีฬาเดินมาถึงสนาม เปิดกล้องมือถือหรือ LINE สแกนป้าย QR ประจำสนาม',
        'พิมพ์ค้นหารหัสหรือชื่อของตนเอง',
        'แตะปุ่มเขียว "✓ เช็คชื่อเข้าซ้อมทันที" (หากป่วยหรือไม่สะดวก ให้กดแท็บ "แจ้งลาซ้อม" และระบุเหตุผล)',
      ],
      quickTip: '🛡️ ป้องกันเช็คชื่อปลอม: ระบบตรวจจับว่าสแกนจากป้ายจริงริมสนาม และแสดงลำดับคนที่มาถึงสนาม',
      renderIllustration: () => (
        <div className="bg-zinc-900 text-white rounded-2xl p-3.5 space-y-2 text-xs border border-zinc-800">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-[10px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              สแกนจากป้ายจริงริมสนาม
            </span>
            <span className="text-zinc-400 font-mono">DIGITAL PASS</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500 text-black font-black flex items-center justify-center text-sm">✓</span>
              <div>
                <p className="font-bold text-white text-xs">เช็คชื่อสำเร็จแล้ว!</p>
                <p className="text-[10px] text-zinc-400">มาถึงสนามเป็นคนที่ #3 ของรอบนี้</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
              มาซ้อม
            </span>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      tabTitle: '4. ตัดยอดขาด',
      badge: 'ฟังก์ชันที่ 4 • ระบบอัตโนมัติ',
      title: 'ปิดรอบ & ตัดยอดขาดอัตโนมัติ',
      subtitle: 'หมดเวลาซ้อม ระบบบันทึกคนที่ไม่ได้มาเป็น "ขาด" ให้อัตโนมัติ',
      icon: '⏱️',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      actionSteps: [
        'เมื่อถึงเวลาสิ้นสุดการซ้อม ระบบจะตรวจนับรายชื่อนักกีฬาทั้งหมดอัตโนมัติ',
        'นักกีฬาที่ไม่ได้สแกนและไม่ได้แจ้งลา ระบบจะลงสถานะเป็น "ขาด (ABSENT)" ให้อัตโนมัติ',
        'โค้ชไม่ต้องกังวลเรื่องลืมกดปิดรอบ และสามารถมาเปิดดูหรือแก้ไขย้อนหลังได้ตลอดเวลา',
      ],
      quickTip: '📜 โปร่งใส: ทุกการแก้ไขย้อนหลังจะมี Audit Logs บันทึกไว้เสมอว่าใครเป็นคนแก้ไขและเวลาใด',
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[10px] font-bold pb-1 border-b border-zinc-200">
            <span className="text-zinc-500 font-mono uppercase">AUTO CUT-OFF ENGINE</span>
            <span className="text-rose-700 font-bold">19:00 น. หมดเวลาซ้อม</span>
          </div>
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-zinc-200">
            <div className="space-y-0.5">
              <p className="font-bold text-zinc-900 text-xs">ตัดยอดผู้ไม่มาซ้อมอัตโนมัติ</p>
              <p className="text-[10px] text-zinc-500">นักกีฬา 2 คนที่ไม่ได้มาสแกน &rarr; บันทึกเป็นขาดซ้อม</p>
            </div>
            <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 font-black text-[10px] border border-rose-200">
              ขาดซ้อม
            </span>
          </div>
        </div>
      ),
    },
    {
      step: 5,
      tabTitle: '5. แดชบอร์ด & Excel',
      badge: 'ฟังก์ชันที่ 5 • สรุปผล & วิเคราะห์',
      title: 'แดชบอร์ดสถิติ & ส่งออก Excel',
      subtitle: 'ดูความสม่ำเสมอ จัดอันดับวินัยนักกีฬา และส่งออกรายงานใน 1 คลิก',
      icon: '📊',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      actionSteps: [
        'หน้าแดชบอร์ดแสดงผลตัวเลขอัตราการเข้าซ้อม สถิติท็อป 5 มาสม่ำเสมอ และขาดซ้อมบ่อย',
        'บนมือถือจัดกลุ่มเป็น 3 แท็บสลับดูง่าย: [ภาพรวม] [อันดับวินัย] [รายชื่อนักกีฬา]',
        'กดปุ่ม "ดาวน์โหลดรายงาน Excel/CSV" ได้ทันที เพื่อนำไปพิมพ์หรือรายงานต่อผู้บริหาร',
      ],
      quickTip: '🏅 ดัชนีความพร้อมสโมสร: ประเมินคะแนนสโมสรเป็น Grade A / B+ / B / C ช่วยวิเคราะห์วินัยทีมได้ทันที',
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-200">
            <span className="font-bold text-zinc-700">ดัชนีความพร้อมสโมสร</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">เกรด A</span>
          </div>
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-zinc-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-xs shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-900 text-xs">ยอดเยี่ยม (ความสม่ำเสมอ 92%)</p>
              <p className="text-[10px] text-zinc-500">นักกีฬาเข้าซ้อมสม่ำเสมอ พร้อมสำหรับการแข่งขัน</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 6,
      tabTitle: '6. แจ้งปัญหา & ฟีดแบ็ก',
      badge: 'ฟังก์ชันที่ 6 • ศูนย์ช่วยเหลือ & ข้อเสนอแนะ',
      title: 'แจ้งปัญหา & ส่งข้อเสนอแนะ (Feedback)',
      subtitle: 'ส่งเรื่องได้ทันทีใน 1 คลิก ไม่ต้องมีบัญชี GitHub ปัญหาจะถูกบันทึกถึงทีมงานทันที',
      icon: '💬',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      actionSteps: [
        'กดปุ่ม "💬 แจ้งปัญหา/ข้อเสนอแนะ" ที่เมนูด้านซ้าย (หรือแถบเมนูด้านบนบนมือถือ)',
        'เลือกประเภทเรื่อง: [แจ้งบัค/ปัญหา] [ขอฟีเจอร์ใหม่] [ระบบทำงานช้า] หรือ [อื่นๆ]',
        'พิมพ์หัวข้อและรายละเอียด (ระบุ LINE ID หรือเบอร์ติดต่อ เพื่อให้ทีมงานติดต่อกลับได้)',
        'กด "ส่งรายงานปัญหา" ข้อมูลจะถูกบันทึกเข้าสู่ระบบฐานข้อมูลทันที ทีมงานและแอดมินจะคอยตรวจสอบในระบบ',
      ],
      quickTip: '⚡ ดึงข้อมูลเครื่องให้อัตโนมัติ: ระบบจะแนบเวอร์ชันและหน้าเว็บที่มีปัญหาไปด้วย ช่วยให้ทีมงานแก้ปัญหาได้อย่างตรงจุดและรวดเร็ว',
      renderIllustration: () => (
        <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
            <span className="font-bold text-zinc-700 flex items-center gap-1.5">
              <span>💬 กล่องส่งฟีดแบ็กและแจ้งปัญหา</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              ส่งตรงถึงผู้พัฒนา
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                🐛 แจ้งบัค
              </span>
              <p className="font-bold text-zinc-900 text-xs">สแกน QR แล้วขึ้นรหัสไม่ตรง</p>
            </div>
            <p className="text-[10px] text-zinc-500">บันทึกเข้าฐานข้อมูลแอดมิน &rarr; สถานะ: รอดำเนินการแก้ไข</p>
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
          setViewMode('stepper');
          setIsOpen(true);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
        title="เปิดดูคู่มือการใช้งานระบบ"
      >
        <span>❓</span>
        <span>คู่มือการใช้งานระบบ</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 flex flex-col justify-between max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📖</span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-zinc-900 leading-tight">
                      คู่มือการใช้งาน WAVON Attendance
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      แนะนำวิธีใช้งานครบทุกฟังก์ชัน เข้าใจง่ายในไม่กี่นาที
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* View Mode Switcher */}
                  <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('stepper')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        viewMode === 'stepper'
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      ทีละขั้นตอน
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('summary')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        viewMode === 'summary'
                          ? 'bg-white text-zinc-900 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      สรุปทั้งหมด
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer text-sm transition"
                    title="ปิดคู่มือ"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Quick Jump Tab Pills (Stepper mode only) */}
              {viewMode === 'stepper' && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none border-b border-zinc-100 text-[11px]">
                  {steps.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentStep(idx)}
                      className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                        idx === currentStep
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80'
                      }`}
                    >
                      {s.tabTitle}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-3 pr-1">
              {viewMode === 'stepper' ? (
                /* STEPPER VIEW */
                <div className="space-y-4">
                  {/* Step Title Header */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-2xl shadow-md shrink-0 ring-4 ring-zinc-100">
                      {current.icon}
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${current.color} mb-1`}>
                        {current.badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 leading-tight">
                        {current.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {current.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Illustration Box */}
                  <div>
                    {current.renderIllustration()}
                  </div>

                  {/* 1-2-3 Action Steps (Bullet points) */}
                  <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-2xl p-3.5 space-y-2">
                    <p className="text-[11px] font-black text-zinc-800 uppercase tracking-wider">
                      วิธีใช้งาน (เข้าใจง่ายใน 3 ข้อ):
                    </p>
                    <div className="space-y-1.5">
                      {current.actionSteps.map((stepText, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs text-zinc-700 leading-relaxed">
                          <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span>{stepText}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips Box */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-900 leading-relaxed font-medium">
                    {current.quickTip}
                  </div>
                </div>
              ) : (
                /* SUMMARY ALL-IN-ONE VIEW */
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    <p className="text-xs font-bold text-zinc-800">
                      ⚡ สรุปฟังก์ชันทั้งหมดของ WAVON ในหน้าเดียว
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      อ่านและทำความเข้าใจได้ทันที ไม่ต้องคลิกเปลี่ยนหน้า
                    </p>
                  </div>

                  {steps.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-zinc-200 hover:border-zinc-300 transition bg-white space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{s.icon}</span>
                          <span className="font-black text-xs text-zinc-900">
                            {s.step}. {s.title}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${s.color}`}>
                          {s.badge}
                        </span>
                      </div>
                      <div className="space-y-1 pl-6">
                        {s.actionSteps.map((txt, aIdx) => (
                          <p key={aIdx} className="text-[11px] text-zinc-600 leading-relaxed">
                            &bull; {txt}
                          </p>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-700 font-medium pl-6">
                        {s.quickTip}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
              {viewMode === 'stepper' ? (
                <>
                  {/* Dots Indicator */}
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
                      <span>{currentStep === steps.length - 1 ? 'เข้าใจแล้ว เริ่มใช้งานทันที ✓' : 'ถัดไป &rarr;'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    มีข้อสงสัยเพิ่มเติม? ส่งฟีดแบ็กหาทีมงานได้ตลอดเวลา
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white shadow-xs transition cursor-pointer min-h-[38px] active:scale-95"
                  >
                    ปิดคู่มือ & เริ่มใช้งาน ✓
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}