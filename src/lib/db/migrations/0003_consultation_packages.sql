-- 多次套餐：购买 sessions>1 定价方案后生成套餐账户；订单表加 package_id 关联核销的子预约
CREATE TABLE IF NOT EXISTS consultation_packages (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  counselor_id TEXT NOT NULL,
  plan_name TEXT,
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS consultation_packages_client_id_idx
  ON consultation_packages (client_id);

CREATE INDEX IF NOT EXISTS consultation_packages_counselor_id_idx
  ON consultation_packages (counselor_id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package_id TEXT;
