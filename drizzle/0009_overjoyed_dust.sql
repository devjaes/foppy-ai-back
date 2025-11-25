CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"data" jsonb,
	"actionable" boolean DEFAULT false NOT NULL,
	"actions" jsonb,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp,
	"viewed_at" timestamp,
	"dismissed_at" timestamp,
	"acted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rec_user_idx" ON "recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rec_status_idx" ON "recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rec_type_idx" ON "recommendations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "rec_created_idx" ON "recommendations" USING btree ("created_at");