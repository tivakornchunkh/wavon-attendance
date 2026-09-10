import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { teams, users } from '../src/server/db/schema';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { AthleteService } from '../src/core/services/athlete.service';
import { parseRosterText } from '../src/core/validators/athlete.validator';

describe('Bulk Athlete Import & Smart Roster Parser (v2.7.0)', () => {
  let testDb: ReturnType<typeof createTestDb>;
  let athleteRepo: AthleteRepository;
  let athleteService: AthleteService;
  const testTeamId = 'team-bulk-test';

  beforeEach(async () => {
    testDb = createTestDb();
    athleteRepo = new AthleteRepository(testDb);
    athleteService = new AthleteService(athleteRepo);

    await testDb.insert(teams).values({
      id: testTeamId,
      name: 'WAVON Academy Test',
    });

    await testDb.insert(users).values({
      id: 'coach-bulk',
      teamId: testTeamId,
      name: 'Head Coach',
      username: 'coach_bulk',
      passwordHash: 'dummy',
      role: 'COACH',
    });
  });

  describe('parseRosterText (Smart Roster Parser)', () => {
    it('parses plain multi-line names', () => {
      const text = `
        สมชาย วิ่งเร็ว
        สิทธิโชค เก่งกาจ
        ธนากร มุ่งมั่น
      `;
      const result = parseRosterText(text);
      expect(result.length).toBe(3);
      expect(result[0].name).toBe('สมชาย วิ่งเร็ว');
      expect(result[0].athleteCode).toBeUndefined();
      expect(result[1].name).toBe('สิทธิโชค เก่งกาจ');
      expect(result[2].name).toBe('ธนากร มุ่งมั่น');
    });

    it('cleans numbered bullet prefixes', () => {
      const text = `
        1. ธีรศิลป์ แดงดา
        2) ชนาธิป สรงกระสินธ์
        - สารัช อยู่เย็น
        * กวินทร์ ธรรมสัจจานันท์
        • ธีราทร บุญมาทัน
      `;
      const result = parseRosterText(text);
      expect(result.length).toBe(5);
      expect(result[0].name).toBe('ธีรศิลป์ แดงดา');
      expect(result[1].name).toBe('ชนาธิป สรงกระสินธ์');
      expect(result[2].name).toBe('สารัช อยู่เย็น');
      expect(result[3].name).toBe('กวินทร์ ธรรมสัจจานันท์');
      expect(result[4].name).toBe('ธีราทร บุญมาทัน');
    });

    it('extracts jersey numbers and codes with comma or # prefix', () => {
      const text = `
        10, กิตติศักดิ์ ชัยชนะ
        #7 วรวุฒิ สปีดดี
        No.9 ศุภชัย ใจเด็ด
        สมศักดิ์ มีชัย, 99
      `;
      const result = parseRosterText(text);
      expect(result.length).toBe(4);
      expect(result[0]).toEqual({ name: 'กิตติศักดิ์ ชัยชนะ', athleteCode: '10', phone: null });
      expect(result[1]).toEqual({ name: 'วรวุฒิ สปีดดี', athleteCode: '7', phone: null });
      expect(result[2]).toEqual({ name: 'ศุภชัย ใจเด็ด', athleteCode: '9', phone: null });
      expect(result[3]).toEqual({ name: 'สมศักดิ์ มีชัย', athleteCode: '99', phone: null });
    });

    it('handles tab-separated lines from Excel copy-paste', () => {
      const text = "11\tบดินทร์ ผาลา\n22\tศุภณัฏฐ์ เหมือนตา";
      const result = parseRosterText(text);
      expect(result.length).toBe(2);
      expect(result[0].athleteCode).toBe('11');
      expect(result[0].name).toBe('บดินทร์ ผาลา');
      expect(result[1].athleteCode).toBe('22');
      expect(result[1].name).toBe('ศุภณัฏฐ์ เหมือนตา');
    });
  });

  describe('createBatchAthletes service execution', () => {
    it('creates multiple athletes with auto-generated ATH-xxx codes', async () => {
      const input = {
        teamId: testTeamId,
        startDate: '2026-03-01',
        athletes: [
          { name: 'ผู้เล่น A' },
          { name: 'ผู้เล่น B' },
          { name: 'ผู้เล่น C' },
        ],
      };

      const created = await athleteService.createBatchAthletes(input);
      expect(created.length).toBe(3);
      expect(created[0].athleteCode).toBe('ATH-001');
      expect(created[1].athleteCode).toBe('ATH-002');
      expect(created[2].athleteCode).toBe('ATH-003');

      // Adding 2 more athletes subsequently auto-increments
      const addedMore = await athleteService.createBatchAthletes({
        teamId: testTeamId,
        startDate: '2026-03-01',
        athletes: [{ name: 'ผู้เล่น D' }, { name: 'ผู้เล่น E' }],
      });
      expect(addedMore.length).toBe(2);
      expect(addedMore[0].athleteCode).toBe('ATH-004');
      expect(addedMore[1].athleteCode).toBe('ATH-005');
    });

    it('creates athletes with custom codes mixed with auto-generated codes', async () => {
      const input = {
        teamId: testTeamId,
        startDate: '2026-03-01',
        athletes: [
          { name: 'กิตติศักดิ์', athleteCode: '10' },
          { name: 'วรวุฒิ', athleteCode: '7' },
          { name: 'ผู้เล่นใหม่' }, // should get ATH-001
        ],
      };

      const created = await athleteService.createBatchAthletes(input);
      expect(created.length).toBe(3);
      expect(created[0].athleteCode).toBe('10');
      expect(created[1].athleteCode).toBe('7');
      expect(created[2].athleteCode).toBe('ATH-001');
    });

    it('throws error when duplicate codes exist within the batch', async () => {
      const input = {
        teamId: testTeamId,
        startDate: '2026-03-01',
        athletes: [
          { name: 'นักเตะ 1', athleteCode: '9' },
          { name: 'นักเตะ 2', athleteCode: '9' },
        ],
      };

      await expect(athleteService.createBatchAthletes(input)).rejects.toThrow('ซ้ำกันภายในชุดข้อมูล');
    });

    it('throws error when a code already exists in the team database', async () => {
      await athleteService.createAthlete({
        teamId: testTeamId,
        name: 'ตัวจริงเดิม',
        athleteCode: '10',
        startDate: '2026-01-01',
        status: 'ACTIVE',
      });

      const input = {
        teamId: testTeamId,
        startDate: '2026-03-01',
        athletes: [{ name: 'ตัวใหม่ชนเบอร์ 10', athleteCode: '10' }],
      };

      await expect(athleteService.createBatchAthletes(input)).rejects.toThrow('มีอยู่ในระบบแล้ว');
    });
  });
});
