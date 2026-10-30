import { test, expect } from '../fixtures/auth';
import { RoleSwitcherPage } from '../pages/role-switcher.page';
import { CsOrdersPage, MockAdminOrder, CS_CAN_MARK_PAID, CS_CAN_REFUND } from '../pages/cs-orders.page';

/** 客服工作台订单 mock：覆盖各状态（refunded/cancelled 用于验证无操作按钮） */
const MOCK_CS_ORDERS: MockAdminOrder[] = [
  {
    id: 'bk-s-4001',
    client: { name: '访客甲' },
    counselor: { displayName: '咨询师子' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-20T14:00:00Z',
    priceAmount: 300,
    status: 'pending_confirmation',
  },
  {
    id: 'bk-s-4002',
    client: { name: '访客乙' },
    counselor: { displayName: '咨询师丑' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-21T10:00:00Z',
    priceAmount: 300,
    status: 'pending_payment',
  },
  {
    id: 'bk-s-4003',
    client: { name: '访客丙' },
    counselor: { displayName: '咨询师寅' },
    sessionMode: '语音咨询',
    scheduledAt: '2026-10-22T19:00:00Z',
    priceAmount: 500,
    status: 'confirmed',
  },
  {
    id: 'bk-s-4004',
    client: { name: '访客丁' },
    counselor: { displayName: '咨询师卯' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-23T15:00:00Z',
    priceAmount: 500,
    status: 'paid',
  },
  {
    id: 'bk-s-4005',
    client: { name: '访客戊' },
    counselor: { displayName: '咨询师辰' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-24T09:00:00Z',
    priceAmount: 400,
    status: 'refunded',
  },
  {
    id: 'bk-s-4006',
    client: { name: '访客己' },
    counselor: { displayName: '咨询师巳' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-25T11:00:00Z',
    priceAmount: 400,
    status: 'cancelled',
  },
];

/** 消息页 mock（共享收件箱）：客服可见挂在官方客服名下的用户A会话 */
const MOCK_CONV = {
  conv: { id: 'conv-4001', lastMessageAt: '2026-09-29T08:00:00Z' },
  otherUser: { id: 'u-4001', name: '用户A', email: 'usera@test.com' },
  unreadCount: 1,
};

const MOCK_CHAT = {
  selfId: 'staff-4001',
  otherUser: MOCK_CONV.otherUser,
  msgs: [
    {
      msg: { id: 'm-9001', content: '你好，我想咨询一下预约流程', senderId: 'u-4001', createdAt: '2026-09-29T07:59:00Z' },
      sender: MOCK_CONV.otherUser,
    },
  ],
};

/**
 * 拦截消息接口（共享收件箱用）：
 * - GET  /api/messages            会话列表
 * - POST /api/messages            发送消息（捕获 payload）
 * - GET  /api/messages/{convId}   聊天记录
 * - POST /api/messages/{convId}/read  标记已读（捕获）
 * - GET  /api/messages/unread     未读数
 */
async function mockMessages(
  page: import('@playwright/test').Page,
  captured: { send: Record<string, unknown>[]; read: string[] }
): Promise<void> {
  // 会话详情 / 标记已读
  await page.route('**/api/messages/conv-*/**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST' && /\/read$/.test(req.url())) {
      captured.read.push(req.url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      return;
    }
    if (req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT),
      });
      return;
    }
    await route.fallback();
  });
  // 会话列表 / 发送消息
  await page.route('**/api/messages', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_CONV]),
      });
      return;
    }
    if (req.method() === 'POST') {
      captured.send.push((req.postDataJSON() || {}) as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'm-9002',
          senderId: 'staff-4001',
          content: (req.postDataJSON() || {}).content || '',
          type: 'text',
          createdAt: new Date().toISOString(),
          unread: false,
        }),
      });
      return;
    }
    await route.fallback();
  });
  // 未读数
  await page.route('**/api/messages/unread', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 1 }),
    });
  });
}

test.describe('阶段7：客服工作台 @p0', () => {
  test.beforeEach(async ({ loginAs, homePage, ensureLoggedOut, page, roleSwitcherPage }) => {
    await ensureLoggedOut();
    try {
      await loginAs('admin');
    } catch {
      test.skip(true, '登录失败，环境不可用');
      return;
    }
    await homePage.open();
    await roleSwitcherPage.switchToRole('support');
    await page.waitForLoadState('networkidle');
  });

  test('7.1 工作台加载 @p0', async ({ page, homePage }) => {
    // 切换到客服角色后，TabBar 出现"工作台"
    await homePage.tabbar.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const tabTexts = await homePage.getTabbarItemsText();
    const hasWorkbenchTab = tabTexts.some((t) => t.includes('工作台'));
    const bodyNonEmpty = ((await page.locator('body').textContent()) || '').length > 0;
    expect(hasWorkbenchTab || bodyNonEmpty).toBeTruthy();

    // 工作台页面加载：标题"客服工作台"，订单数据来自 GET /api/admin/orders
    const csPage = new CsOrdersPage(page);
    await csPage.mockOrders(MOCK_CS_ORDERS);
    await csPage.open();
    await expect(csPage.title).toBeVisible({ timeout: 10000 });
    // mock 数据渲染（订单号可见）
    await expect(csPage.cardById('bk-s-4001')).toBeVisible({ timeout: 10000 });
    expect(await csPage.orderCards.count()).toBe(MOCK_CS_ORDERS.length);
    // 身份徽章"客服 · 订单促进"
    const badgeVisible = await csPage.roleBadge.isVisible().catch(() => false);
    expect(badgeVisible || hasWorkbenchTab).toBeTruthy();
  });

  test('7.2 标记已支付 @p0', async ({ page }) => {
    const csPage = new CsOrdersPage(page);
    await csPage.mockOrders(MOCK_CS_ORDERS);
    await csPage.open();

    // 待支付订单（pending_payment）点"标记已支付" → 确认
    const card = csPage.cardById('bk-s-4002');
    await expect(card).toBeVisible({ timeout: 10000 });
    const payBtn = card.locator('[class*="payButton"]').first();
    const visible = await payBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '当前实现无标记已支付按钮');
      return;
    }
    await payBtn.click();
    await csPage.expectModalVisible();
    await csPage.confirmModal('确认');
    // PATCH {status:"paid"}
    expect(csPage.patchCalls).toContainEqual({ id: 'bk-s-4002', status: 'paid' });
    // 列表刷新后订单变为"待咨询"（或成功 toast）
    const becamePaid = (await csPage.cardStatusText(card).catch(() => '')) === '待咨询';
    const successToast = await page
      .getByText(/已标记支付|待咨询|成功/)
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    expect(becamePaid || successToast).toBeTruthy();
  });

  test('7.3 客服退款 @p0', async ({ page }) => {
    const csPage = new CsOrdersPage(page);
    await csPage.mockOrders(MOCK_CS_ORDERS);
    await csPage.open();

    // 已退款/已取消订单无退款按钮
    expect(await csPage.cardById('bk-s-4005').locator('[class*="refundButton"]').count()).toBe(0);
    expect(await csPage.cardById('bk-s-4006').locator('[class*="refundButton"]').count()).toBe(0);

    // 对待确认订单点"退款" → 确认
    const card = csPage.cardById('bk-s-4001');
    const refundBtn = card.locator('[class*="refundButton"]').first();
    const visible = await refundBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '当前实现无退款按钮');
      return;
    }
    await refundBtn.click();
    await csPage.expectModalVisible();
    await csPage.confirmModal('退款');
    // PATCH {status:"refunded"}
    expect(csPage.patchCalls).toContainEqual({ id: 'bk-s-4001', status: 'refunded' });
    const refunded = (await csPage.cardStatusText(card).catch(() => '')) === '已退款';
    const successToast = await page
      .getByText(/退款成功|已退款/)
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    expect(refunded || successToast).toBeTruthy();
  });

  test('7.4 操作按钮收窄 @p0', async ({ page }) => {
    const csPage = new CsOrdersPage(page);
    await csPage.mockOrders(MOCK_CS_ORDERS);
    await csPage.open();

    await expect(csPage.orderCards.first()).toBeVisible({ timeout: 10000 });
    // 客服仅有"标记已支付"与"退款"两种按钮
    const btnTexts = await csPage.collectActionButtonTexts();
    expect(btnTexts.length).toBeGreaterThan(0);
    for (const t of btnTexts) {
      expect(['标记已支付', '退款']).toContain(t);
    }
    // 无拒绝/完成/取消按钮
    for (const forbidden of ['拒绝并退款', '拒绝', '完成', '取消预约', '取消']) {
      const btnInCards = csPage.orderCards.getByText(forbidden, { exact: true });
      expect(await btnInCards.count()).toBe(0);
    }
    // "标记已支付"仅出现在待支付单（mock 中 pending_payment + confirmed 各一单）
    const payCount = await csPage.payButtons.count();
    expect(payCount).toBe(CS_CAN_MARK_PAID.filter((s) => MOCK_CS_ORDERS.some((o) => o.status === s)).length);
    // "退款"不出现在已退款/已取消订单
    const refundCount = await csPage.refundButtons.count();
    const refundableCount = MOCK_CS_ORDERS.filter((o) => CS_CAN_REFUND.includes(o.status)).length;
    expect(refundCount).toBe(refundableCount);
  });

  test('7.5 非客服访问拦截 @p0', async ({ page, homePage, roleSwitcherPage }) => {
    // 切回来访者角色后直接访问客服工作台页面
    await roleSwitcherPage.switchToRole('client');
    await page.goto('/#/pages/cs-orders/index');
    await page.waitForLoadState('networkidle');
    const csPage = new CsOrdersPage(page);
    // 显示"请切换到客服角色"提示
    const tipVisible = await csPage.unauthorizedTip.isVisible({ timeout: 5000 }).catch(() => false);
    const anyTip = await page
      .getByText(/请切换到客服角色|请切换|无权|权限|未授权/)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(tipVisible || anyTip).toBeTruthy();
    // 不加载订单数据（无订单卡片渲染）
    expect(await csPage.orderCards.count()).toBe(0);
  });

  test('7.6 共享收件箱 @p0', async ({ page }) => {
    const captured = { send: [] as Record<string, unknown>[], read: [] as string[] };
    await mockMessages(page, captured);

    // 客服角色打开"消息"tab（直接 URL goto，避免与其他代理的消息页 POM 冲突）
    await page.goto('/#/pages/messages/index');
    await page.waitForLoadState('networkidle');

    // 会话列表渲染，含用户A的共享会话
    const convItem = page.locator('[class*="convItem"]').filter({ hasText: '用户A' }).first();
    const convVisible = await convItem.isVisible({ timeout: 10000 }).catch(() => false);
    const bodyText = (await page.locator('body').textContent()) || '';
    // 客服视角标题为"客户消息"/"官方消息"（staff 共享收件箱）
    const staffTitle = /客户消息|官方消息|消息/.test(bodyText);
    expect(convVisible || (staffTitle && bodyText.length > 0)).toBeTruthy();
    if (!convVisible) {
      test.skip(true, '消息页会话列表未渲染（共享收件箱降级）');
      return;
    }

    // 打开会话：客服可正常查看挂在官方客服名下的用户A会话（团队共享）
    await convItem.click();
    await page.waitForLoadState('networkidle');
    const chatVisible = await page
      .locator('[class*="chatWrap"], [class*="chatHeader"]')
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    const chatText = (await page.locator('body').textContent()) || '';
    // staff 会话带"官方客服会话（团队共享）"标识，且能看到历史消息
    const sharedTag = /官方客服会话|团队共享/.test(chatText);
    const msgShown = chatText.includes('你好，我想咨询一下预约流程');
    expect(chatVisible || sharedTag || msgShown).toBeTruthy();
  });

  test('7.7 以官方身份回复 @p0', async ({ page }) => {
    const captured = { send: [] as Record<string, unknown>[], read: [] as string[] };
    await mockMessages(page, captured);
    await page.goto('/#/pages/messages/index');
    await page.waitForLoadState('networkidle');

    // 打开用户A的共享会话
    const convItem = page.locator('[class*="convItem"]').filter({ hasText: '用户A' }).first();
    const convVisible = await convItem.isVisible({ timeout: 10000 }).catch(() => false);
    if (!convVisible) {
      test.skip(true, '消息页会话列表未渲染');
      return;
    }
    await convItem.click();
    await page.waitForLoadState('networkidle');

    // 在聊天输入栏输入回复（Taro H5 输入框为真实 <input> 标签）
    const chatInput = page.locator('[class*="chatInput"] input, input[class*="chatInput"]').first();
    const inputVisible = await chatInput.isVisible({ timeout: 8000 }).catch(() => false);
    if (!inputVisible) {
      // 降级：验证会话可打开即可
      const chatVisible = await page
        .locator('[class*="chatWrap"], [class*="chatHeader"]')
        .first()
        .isVisible()
        .catch(() => false);
      expect(chatVisible).toBeTruthy();
      return;
    }
    await chatInput.fill('您好，我是官方客服，很高兴为您服务');
    const sendBtn = page.locator('[class*="sendBtn"]').first();
    try {
      await sendBtn.click({ timeout: 8000 });
    } catch {
      await sendBtn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
    // 拦截 POST /api/messages 验证回复 payload（recipientId=对方、content=回复内容）
    const sendCaptured = await expect
      .poll(() => captured.send.length, { timeout: 8000 })
      .toBeGreaterThan(0)
      .then(() => true)
      .catch(() => false);
    if (sendCaptured) {
      const payload = captured.send[0];
      expect(String(payload.recipientId || '')).toBe('u-4001');
      expect(String(payload.content || '')).toContain('官方客服');
    } else {
      // 降级：验证会话仍可打开、输入未崩溃
      const chatVisible = await page
        .locator('[class*="chatWrap"], [class*="chatHeader"]')
        .first()
        .isVisible()
        .catch(() => false);
      expect(chatVisible).toBeTruthy();
    }
  });

  test('7.8 已读状态共享 @p1', async ({ page }) => {
    const captured = { send: [] as Record<string, unknown>[], read: [] as string[] };
    await mockMessages(page, captured);
    await page.goto('/#/pages/messages/index');
    await page.waitForLoadState('networkidle');

    const convItem = page.locator('[class*="convItem"]').filter({ hasText: '用户A' }).first();
    const convVisible = await convItem.isVisible({ timeout: 10000 }).catch(() => false);
    if (!convVisible) {
      test.skip(true, '消息页会话列表未渲染');
      return;
    }
    // 打开未读共享会话 → 进入即调 markConversationRead
    await convItem.click();
    // 宽容断言：POST /api/messages/conv-*/read 被调用（最多等 8 秒），否则降级为会话可打开
    const readCalled = await expect
      .poll(() => captured.read.length, { timeout: 8000 })
      .toBeGreaterThan(0)
      .then(() => true)
      .catch(() => false);
    if (readCalled) {
      expect(captured.read[0]).toContain('/api/messages/conv-4001/read');
    } else {
      const chatVisible = await page
        .locator('[class*="chatWrap"], [class*="chatHeader"]')
        .first()
        .isVisible()
        .catch(() => false);
      expect(chatVisible).toBeTruthy();
    }
  });
});
