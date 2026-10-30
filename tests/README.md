# MindPace 小程序 E2E 自动化测试

基于 [Playwright](https://playwright.dev) 的端到端测试框架，覆盖心理咨询小程序 H5 端的 9 个测试阶段（阶段0-8）、共 115 个测试用例（清单见 `tests/e2e-testcases.json`）。

## 目录结构

```
tests/
├── e2e/
│   ├── specs/                      # 测试用例（按阶段组织）
│   │   ├── 00-environment.spec.ts  # 阶段0：环境准备
│   │   ├── 01-unlogged.spec.ts     # 阶段1：未登录状态
│   │   ├── 02-auth.spec.ts         # 阶段2：登录与注册
│   │   ├── 03-client-role.spec.ts  # 阶段3：来访者角色
│   │   ├── 04-counselor-role.spec.ts # 阶段4：咨询师角色
│   │   ├── 05-admin-role.spec.ts   # 阶段5：管理员角色
│   │   ├── 06-role-switching.spec.ts # 阶段6：角色切换验证
│   │   └── 08-general.spec.ts      # 阶段8：通用验证
│   ├── pages/                      # 页面对象模型（POM）
│   │   ├── base.page.ts            # 基类
│   │   ├── home.page.ts            # 首页
│   │   ├── login.page.ts           # 登录页
│   │   ├── counselor-detail.page.ts # 咨询师详情
│   │   ├── booking-flow.page.ts    # 预约流程
│   │   ├── bookings.page.ts        # 我的预约
│   │   ├── profile.page.ts         # 个人中心
│   │   └── role-switcher.page.ts   # 角色切换
│   ├── fixtures/                   # 测试夹具
│   │   ├── test-base.ts            # 基础夹具（页面对象 + 工具）
│   │   └── auth.ts                 # 认证夹具（登录/登出）
│   ├── test-data/
│   │   └── accounts.ts             # 测试账号与接口端点
│   └── utils/                      # 工具函数
│       ├── api-monitor.ts          # API 调用监控
│       ├── console-logger.ts       # Console 日志收集
│       └── wait-strategies.ts      # 等待策略
├── reports/                        # 测试报告（自动生成）
└── README.md                        # 本文件
```

## 前置准备

### 1. 安装依赖

```bash
cd "d:\AI Programing\zixun"
npm install -D @playwright/test
npx playwright install chromium
```

### 2. 配置测试账号

在项目根目录创建 `.env` 文件（或直接设置环境变量）：

```bash
# 必填：管理员账号（用于角色切换测试）
# 默认值已内置，可跳过

# 选填：咨询师账号（用于阶段4部分用例）
COUNSELOR_EMAIL=your_counselor@example.com
COUNSELOR_PASSWORD=your_password

# 选填：来访者账号（保留兼容；阶段6.2 现改为注册新账号验证）
VISITOR_EMAIL=your_visitor@example.com
VISITOR_PASSWORD=your_password
```

### 3. 启动被测服务

测试框架默认会自动启动开发服务器（`npm run dev:h5`）。如已手动启动，可设置：

```bash
# PowerShell
$env:SKIP_DEV_SERVER="1"

# 或 CMD
set SKIP_DEV_SERVER=1
```

确保后端 API（`http://123.207.40.7:3001`）可达。

## 运行测试

### 全量运行

```bash
npx playwright test
```

### 按阶段运行

```bash
# 阶段0：环境验证（冒烟测试）
npx playwright test 00-environment

# 阶段1：未登录状态
npx playwright test 01-unlogged

# 阶段2：登录与注册
npx playwright test 02-auth

# 以此类推...
```

### 按优先级过滤

测试用例使用 `@p0`、`@p1`、`@p2`、`@smoke` 标签标注优先级。

```bash
# 仅运行 P0 高优先级用例
npx playwright test --grep @p0

# 仅运行冒烟测试
npx playwright test --grep @smoke

# 排除 P2 低优先级用例
npx playwright test --grep-invert @p2
```

### 调试模式

```bash
# 可视化调试（带浏览器界面）
npx playwright test --headed

# 步进调试（每个操作暂停）
npx playwright test --debug

# 仅运行某个具体用例
npx playwright test -g "1.1 首页正常展示"
```

### 报告查看

```bash
# 生成 HTML 报告
npx playwright test

# 查看报告
npx playwright show-report tests/reports/html
```

报告包含：
- 测试通过/失败统计
- 失败用例截图与视频
- API 调用追踪
- Console 日志

## 测试用例概览

| 阶段 | 文件 | 用例数 | 优先级 | 说明 |
|------|------|--------|--------|------|
| 0 | 00-environment.spec.ts | 4 | P0/P1 | 服务器可达性、API 代理、编译警告 |
| 1 | 01-unlogged.spec.ts | 16 | P0/P1 | 首页展示、TabBar、筛选器、搜索、未登录拦截 |
| 2 | 02-auth.spec.ts | 12 | P0-P2 | 登录注册、表单校验、Token 持久化、登出、微信占位 |
| 3 | 03-client-role.spec.ts | 32 | P0-P2 | 咨询师详情、收藏、预约流程、消息中心、空状态 |
| 4 | 04-counselor-role.spec.ts | 13 | P0-P2 | 咨询师 TabBar、预约/档期/档案管理 |
| 5 | 05-admin-role.spec.ts | 12 | P0-P1 | 管理员 TabBar、审核/订单/用户管理、设为客服 |
| 6 | 06-role-switching.spec.ts | 8 | P0-P1 | 角色循环（来访者→咨询师→管理员→客服）、TabBar 持久、刷新回默认 |
| 7 | 07-cs-workbench.spec.ts | 8 | P0-P1 | 客服工作台：标记已支付、退款、共享收件箱 |
| 8 | 08-general.spec.ts | 10 | P0-P2 | 图标、TabBar 位置、未读红点 99+、聊天轻提示、错误处理、视口 |
| **合计** | | **115** | | |

## 框架设计

### 页面对象模型（POM）

每个页面封装为独立的 Page Object 类，提供：
- 元素定位器（Locator）
- 页面操作方法（如 `clickLogin()`、`selectDate()`）
- 断言辅助方法（如 `expectRoleSwitchVisible()`）

优势：UI 变化时只需修改页面对象，测试用例保持稳定。

### 夹具（Fixtures）

- **test-base.ts**：提供所有页面对象实例 + Console 日志收集器 + API 监控器
- **auth.ts**：继承 test-base，额外提供 `loginAs(account)`、`logout()`、`ensureLoggedOut()`

### 工具函数

- **ApiMonitor**：自动捕获所有 `/api/` 请求，记录 URL、方法、状态码、响应时间
- **ConsoleCollector**：捕获 console 日志和页面错误，支持按类型过滤
- **wait-strategies**：封装常见的等待场景（API 响应、Loading 完成、TabBar 就绪）

### 测试标签

| 标签 | 含义 | 使用场景 |
|------|------|---------|
| `@smoke` | 冒烟测试 | 快速验证核心功能可用 |
| `@p0` | 最高优先级 | 核心流程，必须通过 |
| `@p1` | 中等优先级 | 重要但非阻塞 |
| `@p2` | 低优先级 | 边界场景、占位功能 |

## 已知限制

以下功能在当前小程序版本中为 Mock 数据或占位实现，相关测试用例会自动 `test.skip()`：

1. **咨询师端预约管理**：使用客户端 API，未对接咨询师端接口
2. **咨询师档期/档案**：使用 Mock 数据
3. **管理员各页面**：使用 Mock 数据，审核操作不生效
4. **消息中心**：仅占位页面
5. **微信登录**：仅占位提示

详见 `TEST_PLAN.md` 第五节「已识别的待完善项」。

## CI 集成

```yaml
# GitHub Actions 示例
- name: Run E2E tests
  run: npx playwright test
  env:
    CI: true
    SKIP_DEV_SERVER: ${{ github.event_name == 'pull_request' }}
```

CI 环境下：
- 自动重试失败用例 1 次
- 启用 `trace: 'on-first-retry'` 便于排查
- 生成 JSON 报告 `tests/reports/results.json`

## 故障排查

### 测试启动失败

1. 确认 `npm run dev:h5` 能正常启动（端口 10086）
2. 确认后端 `http://123.207.40.7:3001/api/counselors` 可访问
3. 查看 `tests/reports/html` 中的失败截图

### 角色切换测试失败

1. 确认管理员账号 `511099828@qq.com` / `Fangle23543` 有效
2. 检查 Console 日志中的 `[API]` 输出
3. 角色切换依赖 `currentRole` 状态，刷新后会重置为默认来访者（client）

### 元素定位失败

页面对象使用 `[class*="xxx"]` 模糊匹配 SCSS Module 类名。如类名变更：
1. 查看失败截图确认实际 DOM 结构
2. 更新对应 `.page.ts` 中的 Locator 选择器

## 维护建议

1. **UI 变更后**：优先更新 `pages/` 下的页面对象，而非测试用例
2. **新增 API**：在 `test-data/accounts.ts` 的 `API_ENDPOINTS` 中注册
3. **新增页面**：在 `pages/` 创建对应 Page Object，并在 `fixtures/test-base.ts` 中注册
4. **新增测试**：按阶段编号命名文件（如 `08-xxx.spec.ts`），保持顺序
