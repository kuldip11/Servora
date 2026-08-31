

CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "membership_id" uuid,
  "session_id" uuid,
  "token_hash" varchar(255) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "refresh_tokens_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "tenant_memberships"("id") ON DELETE CASCADE,
  CONSTRAINT "refresh_tokens_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE
);

CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");

CREATE INDEX "refresh_tokens_session_idx" ON "refresh_tokens" USING btree ("session_id");

CREATE UNIQUE INDEX "refresh_tokens_token_hash_unique" ON "refresh_tokens" USING btree ("token_hash");

