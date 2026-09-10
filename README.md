# ⚽ WAVON Athlete Attendance System (v2.1)

> ระบบติดตามสถิติและการเช็คชื่อนักกีฬาสำหรับการฝึกซ้อมกีฬาและอคาเดมีระดับมืออาชีพ  
> **Designed & Engineered for Sports Academies, Clubs & Training Facilities**

![Version](https://img.shields.io/badge/version-2.2.1-emerald)
![Framework](https://img.shields.io/badge/Next.js-16.3-black)
![Database](https://img.shields.io/badge/SQLite-Drizzle--ORM-blue)
![Tests](https://img.shields.io/badge/Vitest-36%20passed-brightgreen)

---

## 🚀 อัปเดตใหญ่ประจำเวอร์ชัน 2.0.0 (What's New in v2.0)

ระบบได้รับการอัปเกรดครั้งสำคัญเพื่อรองรับการใช้งานจริงริมสนาม โดยเพิ่ม 4 ฟีเจอร์หลัก:

### 1. 📱 ระบบสแกน QR Code เช็คชื่อและแจ้งลาซ้อม (Athlete QR Check-In & Leave)
- **เข้าถึงได้ทันทีโดยไม่ต้องมีบัญชีผู้ใช้งาน:** นักกีฬาหรือผู้ปกครองใช้กล้องโทรศัพท์มือถือ หรือแอป LINE สแกน QR Code แล้วเข้าหน้าเช็คชื่อ `/checkin/[sessionId]` ได้ทันที
- **2 โหมดใช้งาน:**
  - **✓ เข้าซ้อม (มา):** แตะที่ชื่อตนเองเพื่อยืนยันเข้าฝึกซ้อม สถานะจะอัปเดตแบบเรียลไทม์
  - **📝 แจ้งลาซ้อม (ลา):** แตะที่ชื่อตนเองเพื่อแจ้งลา พร้อมเลือกเหตุผลด่วน (*ลาป่วย, ติดเรียน/ติดสอบ, ติดธุระครอบครัว, ได้รับบาดเจ็บ*) หรือพิมพ์ระบุเหตุผลเอง
- **ฟังก์ชันสำหรับโค้ชริมสนาม (`/sessions/[id]`):**
  - ปุ่ม **"📱 QR Code เช็คชื่อ"**
  - **โหมดเต็มจอ (Fullscreen iPad Pitch Stand):** สำหรับตั้งแท็บเล็ต/iPad วางริมสนามพร้อมแสดงยอดสด
  - **นับยอดสด (Live Headcount):** แสดงตัวเลขนักกีฬาที่มาแล้วและแจ้งลาแบบเรียลไทม์
  - **ปุ่ม "📋 คัดลอกส่ง LINE":** คัดลอกลิงก์ส่งเข้ากลุ่มไลน์ผู้ปกครองหรือนักกีฬาล่วงหน้า
  - **ปุ่ม "🖨️ พิมพ์ใบ QR ติดสนาม":** พิมพ์ใบสแกนสำหรับติดบอร์ดสนาม (ขนาด A4)

### 2. 🏢 ระบบสมัครสมาชิกและเปิดสโมสรใหม่ (Coach Self-Registration)
- ลงทะเบียนเปิดสโมสรใหม่ได้ด้วยตัวเองที่หน้า `/register`
- ฟอร์ม 5 ช่อง: ชื่อสโมสร, ชื่อโค้ช, Username, รหัสผ่าน และยืนยันรหัสผ่าน พร้อมการตรวจสอบความถูกต้องแบบเรียลไทม์
- สมัครเสร็จเข้าใช้งานได้ทันที (Instant Access) และระบบจะเปิดหน้าต่างคู่มือแนะนำให้อัตโนมัติ

### 3. 🗑️ ระบบลบสโมสรแบบถาวร (Club Deletion & Cascade Hard Delete)
- สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (**ADMIN**) ที่หน้า `/admin`
- ลบข้อมูลทั้งหมดของสโมสรแบบหมดจด (Cascade Hard Delete) ได้แก่ สโมสร, นักกีฬา, รอบซ้อม, สถิติการเช็คชื่อ และบัญชีโค้ช
- **ระบบความปลอดภัย 2 ชั้น:**
  - ต้องพิมพ์ชื่อสโมสรให้ตรงเป๊ะ จึงจะยอมให้ลบ
  - มีระบบป้องกันไม่ให้ลบสโมสร หากเหลือสโมสรสุดท้ายในระบบ

### 4. ❓ ระบบคู่มือสอนการใช้งาน (Interactive Onboarding Guide)
- สไลด์ 4 ขั้นตอนพร้อมภาพกราฟิกสวยงามและคำแนะนำเทคนิคการใช้งาน:
  1. เพิ่มนักกีฬาเข้าสังกัดสโมสร
  2. เปิดรอบซ้อมด่วนใน 1 คลิก
  3. สแกน QR Code & แจ้งลาซ้อมริมสนาม
  4. สรุปแดชบอร์ดสถิติ & ดาวน์โหลด Excel
- สามารถกดเปิดดูซ้ำได้ตลอดเวลาผ่านปุ่ม **"❓ คู่มือการใช้งานระบบ"** บนแถบเมนู

---

## 🔄 คู่มือการย้อนเวอร์ชันฉุกเฉิน (Emergency Rollback Guide)

หากเกิดเหตุฉุกเฉิน หรือต้องการย้อนกลับไปยังเวอร์ชันก่อนหน้า สามารถทำได้ 2 ช่องทางอย่างรวดเร็ว:

### วิธีที่ 1: ย้อนเวอร์ชันทันทีผ่าน Render.com Dashboard (แนะนำ - ทำได้ใน 30 วินาที)
1. เข้าไปที่แดชบอร์ด Render: [dashboard.render.com](https://dashboard.render.com)
2. เลือกบริการ **wavon-attendance**
3. ไปที่แท็บ **"Deploys"** ทางเมนูด้านซ้าย
4. คุณจะเห็นรายการ Deploy ในอดีตทั้งหมดที่มีสถานะ `Live`
5. เลื่อนลงไปยัง Deploy ก่อนหน้า แล้วคลิกที่เมนู 3 จุด `...` เลือก **"Rollback to this deploy"**
6. เว็บไซต์จะย้อนกลับไปใช้เวอร์ชันเดิมทันทีโดยไม่ต้องรอคอมไพล์ใหม่

### วิธีที่ 2: ย้อนเวอร์ชันผ่าน Git Command Line
```bash
# 1. ดูประวัติ commit ล่าสุด
git log --oneline -n 5

# 2. ย้อนกลับ commit ล่าสุดแบบปลอดภัย (Revert)
git revert HEAD

# 3. ส่งคำสั่งย้อนกลับขึ้น GitHub (Render จะ Build เวอร์ชันที่ย้อนให้อัตโนมัติ)
git push origin main
```

---

## 🛠️ คำสั่งสำหรับการพัฒนา (Developer Commands)

```bash
# ติดตั้ง dependencies
npm install

# รันเซิร์ฟเวอร์สำหรับพัฒนา (Local Development)
npm run dev

# รันชุดทดสอบความถูกต้องอัตโนมัติ (29 tests passing)
npm test

# รันการทดสอบและสร้าง Production Build
npm run build

# จำลองการฝึกซ้อมและสถิติตัวอย่าง
npm run simulate
```

---

## 🏗️ โครงสร้างระบบหลัก (Architecture)

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Vector SVG QR Engine
- **Backend:** Next.js Server Actions, Drizzle ORM
- **Database:** SQLite (WAL Mode, Multi-Club Isolation, Cascade Foreign Keys)
- **Testing:** Vitest, In-memory Better-SQLite3 isolated test runner
- **Deployment:** Render.com (Continuous Deployment from `main` branch)

---

&copy; 2026 WAVON Sports Management. Built for High-Performance Teams & Academies.
