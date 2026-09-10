import { sqliteTable, text, uniqueIndex, index, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Teams (รองรับ Multi-team และ Permanent QR Token)
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  permanentQrToken: text('permanent_qr_token'),
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
    isClosed: integer('is_closed').default(0).notNull(),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index('idx_sessions_team_date').on(table.teamId, table.date),
  ]
);

// 4.1 Recurring Training Schedules (ตารางซ้อมประจำสัปดาห์ เช่น จ-ศ 17:00-19:00)
export const recurringSchedules = sqliteTable(
  'recurring_schedules',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    daysOfWeek: text('days_of_week').notNull(), // JSON string เช่น "[1,2,3,4,5]" (1=Mon..5=Fri)
    startTime: text('start_time').notNull(), // Format: HH:mm
    endTime: text('end_time').notNull(), // Format: HH:mm
    title: text('title').notNull(), // เช่น "ซ้อมประจำวัน"
    isActive: integer('is_active').default(1).notNull(),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index('idx_recurring_team').on(table.teamId),
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

// 7. Feedbacks & Bug Reports
export const feedbacks = sqliteTable(
  'feedbacks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    userName: text('user_name'),
    userContact: text('user_contact'), // เบอร์โทร, LINE ID หรืออีเมลสำหรับติดต่อกลับ
    category: text('category', { enum: ['BUG', 'FEATURE', 'PERFORMANCE', 'OTHER'] }).notNull().default('BUG'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    deviceInfo: text('device_info'), // version, browser, OS, URL
    status: text('status', { enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'] }).notNull().default('PENDING'),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index('idx_feedbacks_status').on(table.status),
    index('idx_feedbacks_created_at').on(table.createdAt),
  ]
);

