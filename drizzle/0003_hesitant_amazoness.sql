CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "goal_contribution_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"scheduled_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"contribution_id" integer
);
--> statement-breakpoint
CREATE TABLE "goal_contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar NOT NULL,
	"subtitle" varchar,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"type" varchar NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "debts" ALTER COLUMN "creditor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "contribution_frequency" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "contribution_amount" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "contribution_id" integer;--> statement-breakpoint
ALTER TABLE "goal_contribution_schedule" ADD CONSTRAINT "goal_contribution_schedule_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contribution_schedule" ADD CONSTRAINT "goal_contribution_schedule_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contribution_schedule" ADD CONSTRAINT "goal_contribution_schedule_contribution_id_goal_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."goal_contributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gcs_goal_idx" ON "goal_contribution_schedule" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "gcs_user_idx" ON "goal_contribution_schedule" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gcs_date_idx" ON "goal_contribution_schedule" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "gcs_status_idx" ON "goal_contribution_schedule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gc_goal_idx" ON "goal_contributions" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "gc_user_idx" ON "goal_contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gc_date_idx" ON "goal_contributions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notif_expires_idx" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contribution_id_goal_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."goal_contributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_user_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "budget_category_idx" ON "budgets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "budget_month_idx" ON "budgets" USING btree ("month");--> statement-breakpoint
CREATE INDEX "debts_user_idx" ON "debts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "debts_creditor_idx" ON "debts" USING btree ("creditor_id");--> statement-breakpoint
CREATE INDEX "debts_due_date_idx" ON "debts" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "friends_user_idx" ON "friends" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "friends_friend_idx" ON "friends" USING btree ("friend_id");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_shared_user_idx" ON "goals" USING btree ("shared_user_id");--> statement-breakpoint
CREATE INDEX "pm_user_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pm_shared_user_idx" ON "payment_methods" USING btree ("shared_user_id");--> statement-breakpoint
CREATE INDEX "st_user_idx" ON "scheduled_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "st_next_date_idx" ON "scheduled_transactions" USING btree ("next_execution_date");--> statement-breakpoint
CREATE INDEX "tx_user_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tx_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "tx_category_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "budgets" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "scheduled_transactions" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "category";