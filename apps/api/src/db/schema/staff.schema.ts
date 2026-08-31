import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { branches } from "./branch.schema";

export const staffShifts = pgTable(
  "staff_shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ userIdx: index("staff_shifts_user_idx").on(t.userId) }),
);

export const attendanceLogs = pgTable(
  "attendance_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    checkIn: timestamp("check_in").notNull().defaultNow(),
    checkOut: timestamp("check_out"),
  },
  (t) => ({
    userBranchIdx: index("attendance_user_branch_idx").on(t.userId, t.branchId),
  }),
);
