-- Tối ưu lưu trữ (drizzle-kit không diễn tả được): state người chơi ghi rất thường xuyên
ALTER TABLE "players" SET (fillfactor = 80);--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "state" SET COMPRESSION lz4;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "body" SET COMPRESSION lz4;
