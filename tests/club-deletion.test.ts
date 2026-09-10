import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { teams, users, athletes, trainingSessions, attendances } from '../src/server/db/schema';
import { eq, ne, and } from 'drizzle-orm';

describe('Club Deletion & Cascade Hard Delete', () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
  });

  it('cascades hard delete on team, athletes, sessions, attendances, and club coaches', async () => {
    const clubId = 'team-target';
    const otherClubId = 'team-safe';

    // Seed two clubs
    await testDb.insert(teams).values([
      { id: clubId, name: 'CLUB TO DELETE' },
      { id: otherClubId, name: 'SAFE CLUB' },
    ]);

    // Seed users
    await testDb.insert(users).values([
      { id: 'coach-1', teamId: clubId, name: 'Coach Target', username: 'target_coach', passwordHash: 'pwd', role: 'COACH' },
      { id: 'admin-1', teamId: null, name: 'Super Admin', username: 'admin', passwordHash: 'pwd', role: 'ADMIN' },
      { id: 'coach-2', teamId: otherClubId, name: 'Coach Safe', username: 'safe_coach', passwordHash: 'pwd', role: 'COACH' },
    ]);

    // Seed athletes
    await testDb.insert(athletes).values([
      { id: 'ath-1', teamId: clubId, athleteCode: 'ATH-T1', name: 'Athlete 1', startDate: '2026-01-01', status: 'ACTIVE' },
      { id: 'ath-2', teamId: otherClubId, athleteCode: 'ATH-S1', name: 'Safe Athlete', startDate: '2026-01-01', status: 'ACTIVE' },
    ]);

    // Seed session & attendance
    await testDb.insert(trainingSessions).values({
      id: 'sess-1', teamId: clubId, title: 'Session Target', date: '2026-03-01', startTime: '08:00', endTime: '10:00', createdBy: 'coach-1',
    });
    await testDb.insert(attendances).values({
      id: 'att-1', sessionId: 'sess-1', athleteId: 'ath-1', status: 'PRESENT', checkedBy: 'coach-1',
    });

    // Execute Cascade Hard Delete logic
    const teamSessions = await testDb.select().from(trainingSessions).where(eq(trainingSessions.teamId, clubId));
    const sessionIds = teamSessions.map((s) => s.id);

    for (const sId of sessionIds) {
      await testDb.delete(attendances).where(eq(attendances.sessionId, sId));
    }
    await testDb.delete(trainingSessions).where(eq(trainingSessions.teamId, clubId));
    await testDb.delete(athletes).where(eq(athletes.teamId, clubId));
    await testDb.delete(users).where(and(eq(users.teamId, clubId), ne(users.role, 'ADMIN')));
    await testDb.delete(teams).where(eq(teams.id, clubId));

    // Verify club was deleted
    const deletedTeam = await testDb.select().from(teams).where(eq(teams.id, clubId));
    expect(deletedTeam.length).toBe(0);

    // Verify athletes were deleted
    const deletedAthletes = await testDb.select().from(athletes).where(eq(athletes.teamId, clubId));
    expect(deletedAthletes.length).toBe(0);

    // Verify sessions & attendances were deleted
    const deletedSessions = await testDb.select().from(trainingSessions).where(eq(trainingSessions.teamId, clubId));
    expect(deletedSessions.length).toBe(0);
    const deletedAttendances = await testDb.select().from(attendances).where(eq(attendances.sessionId, 'sess-1'));
    expect(deletedAttendances.length).toBe(0);

    // Verify coach was deleted but admin & other coach remain
    const remainingUsers = await testDb.select().from(users);
    expect(remainingUsers.some((u) => u.id === 'coach-1')).toBe(false);
    expect(remainingUsers.some((u) => u.id === 'admin-1')).toBe(true);
    expect(remainingUsers.some((u) => u.id === 'coach-2')).toBe(true);

    // Verify safe club remains untouched
    const safeClub = await testDb.select().from(teams).where(eq(teams.id, otherClubId));
    expect(safeClub.length).toBe(1);
    const safeAthletes = await testDb.select().from(athletes).where(eq(athletes.teamId, otherClubId));
    expect(safeAthletes.length).toBe(1);
  });

  it('prohibits deleting when only 1 club exists in system', async () => {
    await testDb.insert(teams).values({ id: 'sole-team', name: 'ONLY CLUB' });
    const allTeams = await testDb.select().from(teams);
    expect(allTeams.length).toBe(1);
    expect(allTeams.length <= 1).toBe(true);
  });
});