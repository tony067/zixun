#!/bin/bash
# MindPace 一键部署（在 Mac 终端执行，无需登录服务器）
set -e

SERVER="ubuntu@123.207.40.7"
REMOTE_DIR="/opt/mindpace"

echo "==> [1/3] 同步代码到服务器..."
rsync -avz \
  --exclude node_modules \
  --exclude .next \
  --exclude '/public/uploads' \
  --exclude '.env*' \
  ./ "$SERVER:$REMOTE_DIR/"

echo "==> [2/3] 数据库迁移..."
ssh "$SERVER" "cd $REMOTE_DIR && sudo -u postgres psql mindpace_db -f scripts/migrate-20260901.sql"

echo "==> [3/3] 安装依赖 + 构建 + 重启..."
ssh "$SERVER" "cd $REMOTE_DIR && bun install --registry https://registry.npmmirror.com && bun run build && pm2 restart mindpace"

echo ""
echo "✅ 部署完成：http://123.207.40.7:3001"
