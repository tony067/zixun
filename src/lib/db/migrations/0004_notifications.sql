-- 站内通知表：notify.ts 的 notifyUser 写入目标（此前线上缺表导致所有通知静默失败）
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON notifications (user_id, created_at DESC);
