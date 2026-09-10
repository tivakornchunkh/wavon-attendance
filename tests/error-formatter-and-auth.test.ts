import { describe, it, expect } from 'vitest';
import { formatUserFriendlyError } from '../src/lib/error-formatter';
import { APP_VERSION, APP_VERSION_RAW } from '../src/version';

describe('Error Formatter & Friendly Diagnostics', () => {
  it('translates Minified React error #441 into clear Thai guidance for invalid credentials or connection', () => {
    const rawError = new Error(
      'Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
    );
    const formatted = formatUserFriendlyError(rawError);

    expect(formatted).toContain('ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง');
    expect(formatted).toContain('กรุณาตรวจสอบตัวสะกด');
    expect(formatted).not.toContain('Minified React error');
  });

  it('translates generic minified react errors gracefully', () => {
    const rawError = 'Minified React error #418; visit https://react.dev/errors/418';
    const formatted = formatUserFriendlyError(rawError);

    expect(formatted).toContain('ระบบพบข้อขัดข้องชั่วคราว');
    expect(formatted).not.toContain('Minified React error');
  });

  it('translates Next.js server component render masking errors', () => {
    const rawError = new Error('An error occurred in the Server Components render. The specific message is omitted in production builds');
    const formatted = formatUserFriendlyError(rawError);

    expect(formatted).toContain('ระบบไม่สามารถประมวลผลคำขอได้ในขณะนี้');
  });

  it('translates database locked and busy errors', () => {
    const rawError = new Error('SQLITE_BUSY: database is locked');
    const formatted = formatUserFriendlyError(rawError);

    expect(formatted).toContain('ฐานข้อมูลกำลังทำงานร่วมกับรายการอื่น');
  });

  it('translates network connection errors', () => {
    const rawError = new Error('fetch failed: connect ECONNREFUSED');
    const formatted = formatUserFriendlyError(rawError);

    expect(formatted).toContain('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  });

  it('translates common English auth errors to Thai', () => {
    expect(formatUserFriendlyError(new Error('User not found'))).toBe('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบตัวสะกด');
    expect(formatUserFriendlyError(new Error('Invalid password'))).toBe('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบตัวพิมพ์เล็ก-ใหญ่ (Caps Lock)');
  });

  it('preserves existing descriptive Thai errors', () => {
    const customThai = 'ชื่อผู้ใช้งาน "coach_test" มีผู้อื่นใช้งานแล้ว';
    expect(formatUserFriendlyError(new Error(customThai))).toBe(customThai);
  });

  it('suppresses NEXT_REDIRECT internal signal', () => {
    const redirectErr = { message: 'NEXT_REDIRECT', digest: 'NEXT_REDIRECT;replace;/' };
    expect(formatUserFriendlyError(redirectErr)).toBe('');
  });

  it('returns fallback for empty error', () => {
    expect(formatUserFriendlyError(null)).toBe('เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง');
  });
});

describe('Version Synchronization', () => {
  it('correctly reports v2.2.0 as the active app version', () => {
    expect(APP_VERSION).toBe('v2.2.0');
    expect(APP_VERSION_RAW).toBe('2.2.0');
  });
});

describe('User Persistence & Guardrails', () => {
  it('ensures Arm account exists with ADMIN privileges across reboots', async () => {
    const { ensureDefaultTeamAndCoach } = await import('../src/server/helpers/default-team');
    const { db } = await import('../src/server/db/client');
    const { users } = await import('../src/server/db/schema');
    const { eq } = await import('drizzle-orm');

    await ensureDefaultTeamAndCoach();

    const [armUser] = await db.select().from(users).where(eq(users.username, 'arm')).limit(1);
    expect(armUser).toBeDefined();
    expect(armUser.username).toBe('arm');
    expect(armUser.role).toBe('ADMIN');
  });
});

