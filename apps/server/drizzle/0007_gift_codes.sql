CREATE TABLE "gift_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"gift" jsonb NOT NULL,
	"max" integer,
	"uses" integer DEFAULT 0 NOT NULL,
	"until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_redeems" (
	"code" text NOT NULL,
	"account_id" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_redeems_code_account_id_pk" PRIMARY KEY("code","account_id")
);
--> statement-breakpoint
ALTER TABLE "gift_redeems" ADD CONSTRAINT "gift_redeems_code_gift_codes_code_fk" FOREIGN KEY ("code") REFERENCES "public"."gift_codes"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_redeems" ADD CONSTRAINT "gift_redeems_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;