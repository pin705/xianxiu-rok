CREATE TABLE "codes" (
	"hash" "bytea" PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subs" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "codes" ADD CONSTRAINT "codes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subs" ADD CONSTRAINT "push_subs_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_subs_account_id_index" ON "push_subs" USING btree ("account_id");