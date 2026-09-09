import { sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Teams (รองรับ Multi-team ในอนาคต)
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 2. Users (Admin / User คนเช็คชื่อ)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'USER', 'COACH'] }).default('USER').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// 3. Athletes
export const athletes = sqliteTable(
  'athletes',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    athleteCode: text('athlete_code').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    startDate: text('start_date').notNull(), // Format: YYYY-MM-DD
    status: text('status', { enum: ['ACTIVE', 'INACTIVE'] }).default('ACTIVE').notNull(),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    uniqueIndex('uq_team_athlete_code').on(table.teamId, table.athleteCode),
    index('idx_athletes_team_status').on(table.teamId, table.status),
  ]
);

// 4. Training Sessions
export const trainingSessions = sqliteTable(
  'training_sessions',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    title: text('title').notNull(), // เช่น "ซ้อมเช้า", "Weight Training"
    date: text('date').notNull(), // Format: YYYY-MM-DD
    startTime: text('start_time').notNull(), // Format: HH:mm
    endTime: text('end_time').notNull(), // Format: HH:mm
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index('idx_sessions_team_date').on(table.teamId, table.date),
  ]
);

// 5. Attendances
export const attendances = sqliteTable(
  'attendances',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull().references(() => trainingSessions.id, { onDelete: 'cascade' }),
    athleteId: text('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['PRESENT', 'ABSENT', 'LEAVE'] }).notNull(),
    checkedAt: text('checked_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    checkedBy: text('checked_by').notNull().references(() => users.id),
    notes: text('notes'),
  },
  (table) => [
    // ป้องกันการเช็คชื่อซ้ำของนักกีฬาคนเดิมในรอบเดียวกัน
    uniqueIndex('uq_session_athlete').on(table.sessionId, table.athleteId),
    index('idx_attendances_athlete').on(table.athleteId),
    index('idx_attendances_session').on(table.sessionId),
  ]
);

// 6. Attendance Logs (Audit Log บันทึกการแก้ไขย้อนหลัง)
export const attendanceLogs = sqliteTable(
  'attendance_logs',
  {
    id: text('id').primaryKey(),
    attendanceId: text('attendance_id').notNull().references(() => attendances.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull().references(() => trainingSessions.id, { onDelete: 'cascade' }),
    athleteId: text('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
    previousStatus: text('previous_status', { enum: ['PRESENT', 'ABSENT', 'LEAVE'] }).notNull(),
    newStatus: text('new_status', { enum: ['PRESENT', 'ABSENT', 'LEAVE'] }).notNull(),
    changedBy: text('changed_by').notNull().references(() => users.id),
    changedAt: text('changed_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    reason: text('reason'),
  },
  (table) => [
    index('idx_logs_attendance').on(table.attendanceId),
    index('idx_logs_athlete').on(table.athleteId),
  ]
);

