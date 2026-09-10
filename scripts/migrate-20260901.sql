-- MindPace 迁移：时间列改为 timestamptz（幂等，可重复执行）
-- 仅转换仍为 timestamp（不带时区）的列，已有数据按 UTC 解释
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('bookings','schedule_rules','conversations','messages','users','counselors','favorites')
      AND data_type = 'timestamp without time zone'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN %I TYPE timestamptz USING (%I AT TIME ZONE %L)',
      c.table_name, c.column_name, c.column_name, 'UTC'
    );
  END LOOP;
END $$;

-- 支付相关字段（幂等）
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method text;

-- 支付前置流程（2026-09）：咨询链接 + 时间调剂申请
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adjust_request json;
