CREATE TABLE "accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text,
	"pass" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"cosmetics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"banned_at" timestamp with time zone,
	"ban_reason" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"day" integer NOT NULL,
	"player_id" integer,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inbox_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"world_id" integer NOT NULL,
	"kind" text NOT NULL,
	"body" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "players_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer,
	"world_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"crest" integer DEFAULT 0 NOT NULL,
	"state" jsonb NOT NULL,
	"seen" jsonb,
	"power" integer DEFAULT 0 NOT NULL,
	"hall" smallint DEFAULT 1 NOT NULL,
	"tower" integer DEFAULT 0 NOT NULL,
	"rebirths" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_accountId_unique" UNIQUE("account_id"),
	CONSTRAINT "players_world_name" UNIQUE("world_id","name_key")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"player_id" integer NOT NULL,
	"id" integer NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"win" boolean NOT NULL,
	"body" jsonb NOT NULL,
	CONSTRAINT "reports_player_id_id_pk" PRIMARY KEY("player_id","id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"hash" "bytea" PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" "inet",
	"ua" text
);
--> statement-breakpoint
CREATE TABLE "worlds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "worlds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text DEFAULT '' NOT NULL,
	"seed" integer NOT NULL,
	"season" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"opens_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner" text,
	"lease_until" timestamp with time zone,
	"epoch" integer DEFAULT 0 NOT NULL,
	"online" integer DEFAULT 0 NOT NULL,
	"warp" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_player_id_day_index" ON "events" USING btree ("player_id","day");--> statement-breakpoint
CREATE INDEX "events_name_at_index" ON "events" USING btree ("name","at");--> statement-breakpoint
CREATE INDEX "inbox_open" ON "inbox" USING btree ("world_id") WHERE done_at is null;--> statement-breakpoint
CREATE INDEX "reports_at_index" ON "reports" USING btree ("at");--> statement-breakpoint
CREATE INDEX "sessions_account_id_index" ON "sessions" USING btree ("account_id");