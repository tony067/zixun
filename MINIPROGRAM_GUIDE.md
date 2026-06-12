# MindPace 微信小程序开发指南

## 项目说明

MindPace 是一个神经多样性友好的心理咨询预约平台，已有完整的 Web 版本（Next.js），包含三个端口：
- **来访者端**：浏览咨询师、预约咨询、订单管理、消息、个人中心
- **咨询师端**：预约管理、档期管理、统计数据、来访档案、个人档案
- **管理员端**：数据总览、咨询师审核、订单管理、用户管理

## 后端地址

**线上 API 地址**：`https://mindpace-9fd897a7.eazo.dev`

所有 API 都需要在 header 里带 `Authorization: Bearer <token>`（Eazo Auth JWT）。

---

## API 接口文档

### 认证

使用 Eazo 平台内置 Auth，小程序端需要对接 Eazo Auth 获取 JWT token。

---

### 咨询师相关

#### 获取咨询师列表
```
GET /api/counselors
Query: type（咨询师类型）, approach（咨询取向）, location（地区）, priceMin/priceMax（价格区间）
Response: Counselor[]
```

#### 获取咨询师详情
```
GET /api/counselors/:id
Response: Counselor（含完整档案）
```

#### 搜索咨询师
```
GET /api/counselors/search?q=关键词
Response: Counselor[]
```

---

### 预约相关

#### 来访者预约列表
```
GET /api/bookings
Response: Booking[]（含咨询师信息）
```

#### 创建预约
```
POST /api/bookings
Body: {
  counselorId: string,
  scheduledAt: string（ISO日期），
  durationMinutes: number,
  sessionMode: "视频" | "面谈",
  priceAmount: number,
  clientNote?: string,
  contactName: string,
  contactPhone: string,
  consultReason: string[],
  safetyAssessment: Record<string, boolean>,
  emergencyContactName: string,
  emergencyContactPhone: string,
  agreementSigned: boolean
}
Response: Booking
```

#### 更新预约状态
```
PATCH /api/bookings/:id
Body: { status: "confirmed" | "paid" | "completed" | "cancelled" | "rejected" }
Response: Booking
```

#### 申请改期
```
POST /api/bookings/:id/reschedule
Body: { newTime: string, reason: string }
Response: { ok: true }

PATCH /api/bookings/:id/reschedule
Body: { action: "approve" | "reject", note?: string }
Response: { ok: true }
```

---

### 咨询师档案（咨询师端）

#### 获取/保存档案
```
GET /api/counselor/profile
Response: { exists: boolean, profile: Counselor | null }

PUT /api/counselor/profile
Body: { ...档案字段, action: "save" | "submit" }
Response: { profile: Counselor }
```

#### 获取咨询师订单（咨询师端）
```
GET /api/counselor/bookings
Response: Booking[]（含来访者信息）
```

#### 档期规则
```
GET /api/counselor/schedule
Response: Rule[]

POST /api/counselor/schedule
Body: Rule
Response: Rule

DELETE /api/counselor/schedule/:id
Response: { ok: true }
```

---

### 消息

#### 会话列表
```
GET /api/conversations
Response: Conversation[]（含最后一条消息）
```

#### 消息记录
```
GET /api/messages/:conversationId
Response: Message[]

POST /api/messages/:conversationId
Body: { content: string }
Response: Message
```

---

### 管理员

#### 数据统计
```
GET /api/admin/stats
Response: {
  totalUsers, monthOrders, activeCounselors,
  pendingCounselors, pendingOrders,
  monthRevenue, totalRevenue
}
```

#### 咨询师审核列表
```
GET /api/admin/counselors?status=pending|approved|rejected
Response: Counselor[]

PATCH /api/admin/counselors/:id
Body: { action: "approve" | "reject", reason?: string }
Response: { ok: true }
```

#### 订单管理
```
GET /api/admin/orders?status=...
Response: Booking[]

GET /api/admin/orders/:id
Response: Booking（含来访者+咨询师详情）

PATCH /api/admin/orders/:id
Body: { status: string }
Response: { ok: true }
```

---

## 数据模型

### Counselor（咨询师）
```typescript
{
  id: string
  userId: string
  displayName: string
  bio: string
  tagline: string
  location: string
  totalHours: number
  avatarUrl: string
  counselorTypes: string[]        // ["心理咨询师", "ADHD教练"]
  isSupervisor: boolean
  specialties: string[]           // 擅长领域
  workingGroups: string[]         // 工作人群
  approaches: string[]            // 咨询取向
  sessionDuration: number         // 分钟
  pricePerSession: number         // 元
  sessionModes: string[]          // ["视频", "面谈"]
  isAccepting: boolean
  reviewStatus: "draft" | "pending" | "approved" | "rejected"
  qualifications: string[]        // JSON字符串数组 {id, value}
  education: string[]
  trainings: string[]
  workExperiences: string[]
}
```

### Booking（预约/订单）
```typescript
{
  id: string
  clientId: string
  counselorId: string
  scheduledAt: string             // ISO日期
  durationMinutes: number
  sessionMode: string
  priceAmount: number
  status: "pending_confirmation" | "confirmed" | "pending_payment" | "paid" | "completed" | "cancelled" | "rejected"
  clientNote: string
  rescheduleStatus: "none" | "pending" | "approved" | "rejected"
  rescheduleNewTime: string
  rescheduleReason: string
}
```

---

## 小程序开发建议

### 推荐技术栈
- **Taro 3.x**（React语法，最接近现有代码风格）
- **Taro UI** 或自定义组件库

### 颜色系统（与Web版一致）
```
主色：#9CB48A（哑光绿）
背景：#F5F0E8（暖米白）
卡片：#FFFFFF
文字：#2C2420（深棕）
副文字：#7D736A
浅文字：#9B8E82
边框：#EBE7DF
```

### 优先实现的页面（按重要性）
1. 首页（咨询师列表+筛选）
2. 咨询师详情页
3. 预约流程（4步）
4. 我的预约
5. 消息

### 注意事项
1. 小程序不支持 `window`、`document`，避免直接操作 DOM
2. 路由用 Taro 的 `navigateTo` / `switchTab`
3. 存储用 `Taro.setStorage` 替代 `localStorage`
4. 图片上传走后端 presigned URL，不要直接调 S3
5. 支付需要对接微信支付，替换现有的模拟支付流程

---

## 代码仓库

GitHub：https://github.com/tony067/zixun

Web 线上地址：https://mindpace-9fd897a7.eazo.dev

数据库：Eazo 平台内置 PostgreSQL（已部署，新对话无需重建）
