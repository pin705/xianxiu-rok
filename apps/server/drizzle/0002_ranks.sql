ALTER TABLE "players" ADD COLUMN "pvp" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "week_no" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "week_pts" integer DEFAULT 0 NOT NULL;