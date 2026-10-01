-- 个性服务（评估类）一期：商品表 + 订单表
CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY,
  counselor_id text NOT NULL,
  type text NOT NULL DEFAULT 'assessment',
  name text NOT NULL,
  tagline text,
  description text,
  price integer NOT NULL DEFAULT 0,
  questions json DEFAULT '[]',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_orders (
  id text PRIMARY KEY,
  service_id text NOT NULL,
  counselor_id text NOT NULL,
  client_id text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_payment',
  payment_method text,
  paid_at timestamptz,
  answers json,
  submitted_at timestamptz,
  report text,
  report_at timestamptz,
  service_name text,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_orders_client ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_counselor ON service_orders(counselor_id);

-- 应用账号授权（建表后必须执行，否则运行时 permission denied）
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO mindpace_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_orders TO mindpace_user;
