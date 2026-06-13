-- Migration: 为 users 表追加 password_hash 字段（独立部署登录注册使用）
-- 对已有行无影响（nullable，默认 NULL）
-- 服务器上手动执行：psql $DATABASE_URL -f src/lib/db/migrations/0001_add_password_hash.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
