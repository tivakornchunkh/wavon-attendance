/**
 * Utility สำหรับแปลง Error ทั้งหมด (รวมถึง React Minified Errors, Next.js Server Errors, Network และ DB Errors)
 * ให้กลายเป็นข้อความภาษาไทยที่สุภาพ เข้าใจง่าย และให้คำแนะนำที่นำไปปฏิบัติได้จริง (Actionable Guidance)
 */

export function formatUserFriendlyError(error: unknown, fallbackMessage = 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง'): string {
  if (!error) return fallbackMessage;

  let rawMessage = '';

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message || '';
  } else if (typeof error === 'object' && error !== null) {
    const obj = error as { message?: string; digest?: string; error?: string };
    rawMessage = obj.message || obj.error || '';
  }

  // Next.js redirect is not an error
  if (rawMessage.includes('NEXT_REDIRECT') || (typeof error === 'object' && error !== null && 'digest' in error && String((error as { digest?: string }).digest).includes('NEXT_REDIRECT'))) {
    return '';
  }

  const cleanMsg = rawMessage.trim();

  // 1. ตรวจจับ Minified React Error (เช่น React error #441 ที่เกิดจาก Server Action Masking ใน Production)
  if (cleanMsg.includes('Minified React error #441') || cleanMsg.includes('react.dev/errors/441')) {
    return 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง (ชื่อผู้ใช้งานหรือรหัสผ่านไม่ตรงกับในระบบ) กรุณาตรวจสอบตัวสะกดหรือกดเปิดสโมสรใหม่';
  }

  if (cleanMsg.includes('Minified React error') || cleanMsg.includes('react.dev/errors/')) {
    return 'ระบบพบข้อขัดข้องชั่วคราวในการประมวลผลข้อมูล กรุณารีเฟรชหน้าเว็บหรือลองใหม่อีกครั้ง';
  }

  // 2. ตรวจจับข้อความ Server Component Render Masking ของ Next.js
  if (cleanMsg.includes('An error occurred in the Server Components render')) {
    return 'ระบบไม่สามารถประมวลผลคำขอได้ในขณะนี้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง';
  }

  // 3. ตรวจจับ Database & SQLite Errors
  if (
    cleanMsg.includes('SQLITE_BUSY') ||
    cleanMsg.includes('database is locked') ||
    cleanMsg.includes('SQLITE_LOCKED')
  ) {
    return 'ฐานข้อมูลกำลังทำงานร่วมกับรายการอื่น กรุณารอสักครู่ (2-3 วินาที) แล้วลองใหม่อีกครั้ง';
  }

  if (
    cleanMsg.includes('better-sqlite3') ||
    cleanMsg.includes('sqlite') ||
    cleanMsg.includes('drizzle') ||
    cleanMsg.includes('SQLITE_')
  ) {
    return 'เกิดข้อขัดข้องในการบันทึกข้อมูล กรุณาตรวจสอบความถูกต้องของข้อมูลแล้วลองใหม่อีกครั้ง';
  }

  // 4. ตรวจจับ Network & Fetch Errors
  if (
    cleanMsg.includes('Failed to fetch') ||
    cleanMsg.includes('NetworkError') ||
    cleanMsg.includes('fetch failed') ||
    cleanMsg.includes('ECONNREFUSED') ||
    cleanMsg.includes('ENOTFOUND') ||
    cleanMsg.includes('timeout')
  ) {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของท่านแล้วลองใหม่อีกครั้ง';
  }

  // 5. ตัด Technical prefix ออกหากมี เช่น "Error: "
  let sanitized = cleanMsg;
  if (sanitized.startsWith('Error: ')) {
    sanitized = sanitized.substring(7).trim();
  }

  // 6. แปลข้อความภาษาอังกฤษทั่วไปที่พบบ่อย
  const lower = sanitized.toLowerCase();
  if (lower.includes('user not found') || lower.includes('not found user')) {
    return 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบตัวสะกด';
  }
  if (lower.includes('invalid password') || lower.includes('wrong password') || lower.includes('incorrect password')) {
    return 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบตัวพิมพ์เล็ก-ใหญ่ (Caps Lock)';
  }
  if (lower.includes('unauthorized') || lower.includes('forbidden')) {
    return 'ท่านไม่มีสิทธิ์เข้าถึงส่วนนี้ กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์';
  }

  // หากเป็นข้อความภาษาไทยที่มีความหมายอยู่แล้ว ให้ส่งกลับทันที
  if (/[\u0E00-\u0E7F]/.test(sanitized) && sanitized.length > 3) {
    return sanitized;
  }

  return fallbackMessage;
}

