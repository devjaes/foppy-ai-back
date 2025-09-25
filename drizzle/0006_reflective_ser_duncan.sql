ALTER TABLE "transactions" ADD COLUMN "budget_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tx_budget_idx" ON "transactions" USING btree ("budget_id");