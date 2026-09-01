

CREATE TABLE "attendance_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "check_in" timestamp DEFAULT now() NOT NULL,
  "check_out" timestamp,
  CONSTRAINT "attendance_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "attendance_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
);

CREATE INDEX "attendance_user_branch_idx" ON "attendance_logs" USING btree ("user_id", "branch_id");

