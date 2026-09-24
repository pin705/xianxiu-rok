CREATE TABLE "chat" (
	"world_id" integer NOT NULL,
	"id" integer NOT NULL,
	"ch" text NOT NULL,
	"player_id" integer NOT NULL,
	"name" text NOT NULL,
	"text" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "chat_world_id_id_pk" PRIMARY KEY("world_id","id")
);
--> statement-breakpoint
CREATE TABLE "chat_reports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chat_reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"world_id" integer NOT NULL,
	"msg_id" integer NOT NULL,
	"reporter" integer NOT NULL,
	"author" integer NOT NULL,
	"text" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "muted_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_at_index" ON "chat" USING btree ("at");