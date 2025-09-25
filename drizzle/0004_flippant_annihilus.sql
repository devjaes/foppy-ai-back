ALTER TABLE "budgets" ALTER COLUMN "month" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "debts" ALTER COLUMN "due_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "end_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ALTER COLUMN "next_execution_date" SET DATA TYPE timestamp;