# MindPace 开发与部署规范

> 本文档记录项目的业务规则、部署流程和历史教训。修改代码前请先对照本文档，避免前后不一致。

## 一、业务规则（改动前必读）

### 1. 支付环节
- 网页端是过渡产品，**没有真实支付系统**，真实支付在小程序版本接入
- 网页端采用**模拟支付**，且**支付前置**：来访在下单流程中选时间/填表单后立即支付，支付成功即创建订单
- 支付成功 → 订单直接进入「待确认（已支付·待咨询师确认）」，不再有"待支付"环节（pending_payment 仅兼容旧数据）
- 支付失败必须真实报错提示，不允许假成功

### 2. 订单状态流转（2026-09 改版，三端统一）
```
来访选时间（或填时间调剂申请）→ 填表单 → 支付 → 待确认 pending_confirmation（已支付·待咨询师确认）
  → 咨询师确认（填写咨询设置说明 + 咨询链接 meetingLink，可改时间）→ 待咨询 paid
  → 到达开始时间自动 → 进行中 in_progress（并发送双方到点提醒）
  → 超过结束时间自动 → 已完成 completed（咨询师/管理员也可手动标记）
任意中间状态 → cancelled（取消）/ rejected（拒绝，仅待确认阶段；拒绝后提示模拟退款）
```
- **自动流转**由 `syncBookingProgress()`（queries/bookings.ts）在各订单查询接口前惰性执行，无定时任务
- **时间调剂申请**（adjustRequest）：无可约时段时来访填写期望时间说明，随订单提交；占位时间为下单时间+48小时；咨询师确认时**必须**指定真实时间（服务端强制），时间只需不与已有预约冲突（ignoreRules，不要求在档期规则内）

### 3. 三端权限矩阵
| 操作 | 来访 | 咨询师 | 管理员 |
|------|------|--------|--------|
| 取消订单 | 自己的待确认/待咨询 | 待确认/待咨询/进行中 | 任意中间状态 |
| 确认预约（→待咨询，含链接/改时间） | ✗ | ✓ | ✓ |
| 拒绝订单（模拟退款） | ✗ | ✓（待确认阶段） | ✓ |
| 标记已完成 | ✗ | ✓（待咨询/进行中） | ✓ |
| 直接改期 | ✗ | ✓ | ✓ |
| 管理员客服特殊权限 | — | — | 任意合法状态间可改 |

### 4. 预约与档期
- 常规预约创建**必须在服务端做冲突校验**（不在档期内 / 被屏蔽 / 已被预约 → 拒绝），共享库在 `src/lib/scheduling/slots.ts`
- 咨询师确认时改时间/调剂申请定时间：只校验"不能是过去 + 不与已有预约冲突"（`checkSlotAvailable(..., { ignoreRules: true })`）
- 所有档期规则的日期时刻均为**北京时间（UTC+8）墙钟**
- 「临时屏蔽」规则必须选择星期（weekdays），否则规则不生效
- 提交审核的价格校验：`pricingOptions` 中至少一个方案价格 > 0，旧字段 `pricePerSession` 不作为必填

## 二、部署规范

### 一键部署（推荐）
Mac 终端执行，全程无需登录服务器：
```bash
cd /Users/qiujing/Documents/Trae/trae_projects/zixun && ./scripts/deploy.sh
```
脚本自动完成：rsync 同步 → 数据库迁移 → 服务器安装依赖/构建/pm2 重启。

### 关键事实（出指令时注意）
- 服务器地址：`ubuntu@123.207.40.7`，应用目录 `/opt/mindpace`，端口 3001
- 服务器上 bun 的位置是 **`/usr/bin/bun`**，不是 `~/.bun/bin/bun`
- 依赖安装必须用 npmmirror 镜像：`bun install --registry https://registry.npmmirror.com`
- 重启命令：`pm2 restart mindpace`
- rsync 排除项：`node_modules`、`.next`、`/public/uploads`（注意必须带 `/public` 前缀，只写 `uploads` 会把源码目录也排除掉）、`.env*`
- 服务器目录属主必须是 ubuntu：`sudo chown -R ubuntu:ubuntu /opt/mindpace`

### 数据库
- 独立 PostgreSQL，库名 `mindpace_db`，用户 postgres
- 所有时间列统一 `timestamptz`（带时区），历史数据按 UTC 解释
- 迁移 SQL 必须写成**幂等**的（可重复执行），参考 `scripts/migrate-20260901.sql`

## 三、历史教训（避免重复踩坑）

1. **bun 路径**：部署指令写 `~/.bun/bin/bun` 会报 No such file，服务器实际是 `/usr/bin/bun`
2. **腾讯云镜像**：mirrors.tencentyun.com 可能解析依赖失败，换 npmmirror
3. **node_modules 权限**：混合 root/ubuntu 属主会导致删除失败，用 `sudo chown -R ubuntu:ubuntu /opt/mindpace` 修复
4. **rsync 排除规则**：`--exclude uploads` 会误伤源码目录，必须写 `--exclude '/public/uploads'`
5. **时区错位**：timestamp（无时区）+ 前端本地展示会差 8 小时，已全部改 timestamptz
6. **改期审批 URL**：模板字符串里 `\${id}`（多了反斜杠）会导致 URL 错误，注意转义
7. **支付假成功**：前端调 PATCH 后必须检查 `res.ok`，失败要抛错并展示
