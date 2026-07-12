-- 用户收藏咨询师：让收藏跟随账号，而不是只保存在浏览器 localStorage。
CREATE TABLE IF NOT EXISTS user_favorite_counselors (
  user_id TEXT NOT NULL,
  counselor_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, counselor_id)
);

CREATE INDEX IF NOT EXISTS user_favorite_counselors_user_id_idx
  ON user_favorite_counselors (user_id);

CREATE INDEX IF NOT EXISTS user_favorite_counselors_counselor_id_idx
  ON user_favorite_counselors (counselor_id);
