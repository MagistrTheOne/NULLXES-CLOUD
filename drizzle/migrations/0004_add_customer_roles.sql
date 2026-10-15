ALTER TABLE "customer_profiles"
ADD COLUMN "role" text DEFAULT 'USER' NOT NULL;
--> statement-breakpoint
ALTER TABLE "customer_profiles"
ADD CONSTRAINT "customer_profiles_role_chk"
CHECK ("role" IN ('CEO', 'ADMIN', 'MANAGER', 'VIP', 'USER'));
