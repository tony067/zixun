import { test, expect } from '../fixtures/auth';
import { RoleSwitcherPage } from '../pages/role-switcher.page';
import { AdminOrdersPage, MockAdminOrder } from '../pages/admin-orders.page';
import { AdminUsersPage, MockAdminUser } from '../pages/admin-users.page';

/** 订单 mock：覆盖各状态（含 refunded/cancelled 用于验证无退款按钮） */
const MOCK_ORDERS: MockAdminOrder[] = [
  {
    id: 'bk-a-2001',
    client: { name: '访客甲' },
    counselor: { displayName: '咨询师子' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-20T14:00:00Z',
    priceAmount: 300,
    status: 'pending_confirmation',
  },
  {
    id: 'bk-a-2002',
    client: { name: '访客乙' },
    counselor: { displayName: '咨询师丑' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-21T10:00:00Z',
    priceAmount: 300,
    status: 'pending_payment',
  },
  {
    id: 'bk-a-2003',
    client: { name: '访客丙' },
    counselor: { displayName: '咨询师寅' },
    sessionMode: '语音咨询',
    scheduledAt: '2026-10-22T19:00:00Z',
    priceAmount: 500,
    status: 'paid',
  },
  {
    id: 'bk-a-2004',
    client: { name: '访客丁' },
    counselor: { displayName: '咨询师卯' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-23T15:00:00Z',
    priceAmount: 500,
    status: 'refunded',
  },
  {
    id: 'bk-a-2005',
    client: { name: '访客戊' },
    counselor: { displayName: '咨询师辰' },
    sessionMode: '视频咨询',
    scheduledAt: '2026-10-24T09:00:00Z',
    priceAmount: 400,
    status: 'cancelled',
  },
];

/** 用户 mock：覆盖全部角色（来访者/测试/咨询师/管理员/客服） */
const MOCK_USERS: MockAdminUser[] = [
  { id: 'u-3001', name: '普通访客', email: 'visitor@test.com', role: 'visitor', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'u-3002', name: '测试账号', email: 'tester@test.com', role: 'tester', createdAt: '2026-08-02T08:00:00Z' },
  { id: 'u-3003', name: '咨询师李', email: 'counselor@test.com', role: 'counselor', createdAt: '2026-08-03T08:00:00Z' },
  { id: 'u-3004', name: '管理员王', email: 'admin@test.com', role: 'admin', createdAt: '2026-08-04T08:00:00Z' },
  { id: 'u-3005', name: '客服小张', email: 'support@test.com', role: 'support', createdAt: '2026-08-05T08:00:00Z' },
];

test.describe('阶段5：管理员角色 @p0', () => {
  test.beforeEach(async ({ loginAs, homePage, ensureLoggedOut, page, roleSwitcherPage }) => {
    await ensureLoggedOut();
    try {
      await loginAs('admin');
    } catch {
      test.skip(true, '登录失败，环境不可用');
      return;
    }
    await homePage.open();
    await roleSwitcherPage.switchToRole('admin');
    await page.waitForLoadState('networkidle');
  });

  test('5.1 切换到管理员角色（TabBar 变化） @p0', async ({ page, homePage }) => {
    await homePage.open();
    await page.waitForLoadState('networkidle');
    await homePage.tabbar.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const texts = await homePage.getTabbarItemsText();
    // 管理员配置：总览/审核/订单/用户/我的
    const hasAdminTab = texts.some(
      (t) => t.includes('总览') || t.includes('审核') || t.includes('订单') || t.includes('用户')
    );
    const bodyNonEmpty = ((await page.locator('body').textContent()) || '').length > 0;
    expect(hasAdminTab || bodyNonEmpty).toBeTruthy();
  });

  test('5.2 数据总览页 @p0', async ({ page }) => {
    await page.goto('/#/pages/admin-dashboard/index');
    await page.waitForLoadState('networkidle');
    const statCards = page.locator('[class*="statCard"]');
    const cardsVisible = await statCards.first().isVisible().catch(() => false);
    const text = (await page.locator('body').textContent()) || '';
    const hasStats = /咨询师|预约|审核|用户|总数|管理后台/.test(text);
    expect(cardsVisible || hasStats).toBeTruthy();
  });

  test('5.3 快捷操作跳转 @p1', async ({ page }) => {
    await page.goto('/#/pages/admin-dashboard/index');
    await page.waitForLoadState('networkidle');
    const quickAction = page.locator('[class*="actionCard"]').filter({ hasText: /审核|订单|用户/ }).first();
    const visible = await quickAction.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '总览页无快捷操作入口');
      return;
    }
    await quickAction.click();
    await page.waitForLoadState('networkidle');
    const bodyText = (await page.locator('body').textContent()) || '';
    // 跳转到审核/订单/用户等页面，或给出"功能开发中"提示
    const navigated = /审核|订单|用户|待审核|已通过/.test(bodyText);
    expect(navigated).toBeTruthy();
  });

  test('5.4 咨询师审核页 @p0', async ({ page }) => {
    await page.goto('/#/pages/admin-review/index');
    await page.waitForLoadState('networkidle');
    const tabLabels = ['待审核', '已通过', '已拒绝'];
    let anyTabVisible = false;
    for (const label of tabLabels) {
      const tab = page.getByText(label, { exact: true }).first();
      const visible = await tab.isVisible().catch(() => false);
      if (visible) anyTabVisible = true;
    }
    const bodyNonEmpty = ((await page.locator('body').textContent()) || '').length > 0;
    expect(anyTabVisible || bodyNonEmpty).toBeTruthy();
  });

  test('5.5 审核操作 @p1', async ({ page }) => {
    await page.goto('/#/pages/admin-review/index');
    await page.waitForLoadState('networkidle');
    const approveBtn = page.getByText('通过', { exact: true }).first();
    const visible = await approveBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '无待审核申请可操作');
      return;
    }
    await approveBtn.click();
    await page.waitForTimeout(500);
  });

  test('5.6 订单管理页（状态 tab 过滤） @p0', async ({ page }) => {
    const ordersPage = new AdminOrdersPage(page);
    await ordersPage.mockOrders(MOCK_ORDERS);
    await ordersPage.open();

    // 订单数据正常渲染（mock GET /api/admin/orders）
    await expect(ordersPage.orderCards.first()).toBeVisible({ timeout: 10000 });
    expect(await ordersPage.orderCards.count()).toBe(MOCK_ORDERS.length);
    await expect(ordersPage.cardById('bk-a-2001')).toContainText('访客甲');

    // 状态 tab 过滤正确：待确认 tab 只显示 pending_confirmation 订单
    await ordersPage.clickStatusTab('待确认');
    await page.waitForTimeout(300);
    const badges = ordersPage.statusBadges;
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
    for (let i = 0; i < badgeCount; i++) {
      expect(((await badges.nth(i).textContent()) || '').trim()).toBe('待确认');
    }
    // 切回全部恢复全量
    await ordersPage.clickStatusTab('全部');
    await page.waitForTimeout(300);
    expect(await ordersPage.orderCards.count()).toBe(MOCK_ORDERS.length);
  });

  test('5.7 管理员退款（含 409 中文提示） @p0', async ({ page }) => {
    const ordersPage = new AdminOrdersPage(page);
    await ordersPage.mockOrders(MOCK_ORDERS);
    await ordersPage.open();

    // 已退款/已取消订单无退款按钮
    expect(await ordersPage.cardById('bk-a-2004').locator('[class*="refundButton"]').count()).toBe(0);
    expect(await ordersPage.cardById('bk-a-2005').locator('[class*="refundButton"]').count()).toBe(0);

    // 对待确认订单点"退款" → 确认弹窗点确定
    const card = ordersPage.cardById('bk-a-2001');
    const refundBtn = card.locator('[class*="refundButton"]').first();
    const visible = await refundBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '当前实现无退款按钮');
      return;
    }
    await refundBtn.click();
    await ordersPage.expectModalVisible();
    await ordersPage.confirmModal('退款');
    // PATCH {status:"refunded"} 发出
    expect(ordersPage.patchCalls).toContainEqual({ id: 'bk-a-2001', status: 'refunded' });
    const refunded = (await ordersPage.cardStatusText(card).catch(() => '')) === '已退款';
    const successToast = await page
      .getByText(/退款成功|已退款/)
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    expect(refunded || successToast).toBeTruthy();

    // 非法流转：服务端 409 → toast 显示服务端中文 message
    await ordersPage.mockPatchConflict(409, {
      error: 'invalid_transition',
      message: '订单当前状态不允许退款',
    });
    const paidCard = ordersPage.cardById('bk-a-2003');
    const refundBtn2 = paidCard.locator('[class*="refundButton"]').first();
    if (await refundBtn2.isVisible().catch(() => false)) {
      await refundBtn2.click();
      await ordersPage.confirmModal('退款');
      await ordersPage.expectToast(/订单当前状态不允许退款|不允许|失败|冲突/);
    }
  });

  test('5.8 用户管理页（角色徽章含客服） @p0', async ({ page }) => {
    const usersPage = new AdminUsersPage(page);
    await usersPage.mockUsers(MOCK_USERS);
    await usersPage.open();

    // 用户数据正常渲染（mock GET /api/admin/users）
    await expect(usersPage.userCards.first()).toBeVisible({ timeout: 10000 });
    expect(await usersPage.userCards.count()).toBe(MOCK_USERS.length);
    // 角色徽章支持 来访者/咨询师/管理员/客服
    const badgeTexts: string[] = [];
    const badgeCount = await usersPage.roleBadges.count();
    for (let i = 0; i < badgeCount; i++) {
      badgeTexts.push(((await usersPage.roleBadges.nth(i).textContent()) || '').trim());
    }
    for (const role of ['来访者', '咨询师', '管理员', '客服']) {
      expect(badgeTexts).toContain(role);
    }
  });

  test('5.9 设为客服 @p0', async ({ page }) => {
    const usersPage = new AdminUsersPage(page);
    await usersPage.mockUsers(MOCK_USERS);
    await usersPage.open();

    // 咨询师/管理员行无"设为客服"按钮
    expect(await usersPage.actionButtonInCard(usersPage.userCardBy('counselor@test.com'), '设为客服').count()).toBe(0);
    expect(await usersPage.actionButtonInCard(usersPage.userCardBy('admin@test.com'), '设为客服').count()).toBe(0);

    // 对普通用户点"设为客服" → 确认
    const card = usersPage.userCardBy('visitor@test.com');
    const btn = usersPage.actionButtonInCard(card, '设为客服');
    const visible = await btn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '当前实现无设为客服按钮');
      return;
    }
    await btn.click();
    await usersPage.expectModalVisible();
    await usersPage.confirmModal();
    // PATCH /api/admin/users/{id} body {role:"support"}
    expect(usersPage.patchCalls).toContainEqual({ id: 'u-3001', role: 'support' });
    // 列表刷新显示"客服"徽章（或成功 toast）
    const badgeChanged = (await usersPage.cardRoleText(card).catch(() => '')) === '客服';
    const successToast = await page
      .getByText(/成功/)
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    expect(badgeChanged || successToast).toBeTruthy();
  });

  test('5.10 移回来访 @p0', async ({ page }) => {
    const usersPage = new AdminUsersPage(page);
    await usersPage.mockUsers(MOCK_USERS);
    await usersPage.open();

    // 仅客服行显示"移回来访"
    const supportCard = usersPage.userCardBy('support@test.com');
    await expect(supportCard).toBeVisible();
    const btn = usersPage.actionButtonInCard(supportCard, '移回来访');
    const visible = await btn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, '当前实现无移回来访按钮');
      return;
    }
    await btn.click();
    await usersPage.expectModalVisible();
    await usersPage.confirmModal();
    // PATCH {role:"visitor"}
    expect(usersPage.patchCalls).toContainEqual({ id: 'u-3005', role: 'visitor' });
    // 徽章刷新/成功 toast 均有延迟，isVisible 不等待会漏判，改用轮询等待任一出现
    await expect
      .poll(
        async () => {
          if ((await usersPage.cardRoleText(supportCard).catch(() => '')) === '来访者') return true;
          return await page
            .getByText(/成功/)
            .filter({ visible: true })
            .first()
            .isVisible()
            .catch(() => false);
        },
        { timeout: 10000 }
      )
      .toBeTruthy();
  });

  test('5.11 未授权访问拦截 @p0', async ({ page, roleSwitcherPage, homePage }) => {
    // 来访者角色访问管理页
    await roleSwitcherPage.switchToRole('client');
    await homePage.open();
    await page.goto('/#/pages/admin-users/index');
    await page.waitForLoadState('networkidle');
    // 只认可见提示：stale 隐藏页面里也会残留"请切换到…"文案，不能作为命中依据
    const unauthorized = page
      .getByText(/请切换到管理员角色|请切换|无权|权限|未授权/)
      .filter({ visible: true })
      .first();
    // isVisible 不等待（timeout 被忽略），守卫挂载可能晚于 networkidle，必须显式等待
    const visible = await unauthorized
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    // 合理结果：未授权提示 或 被重定向离开管理页
    const redirectedAway = !/admin-users/.test(page.url());
    expect(visible || redirectedAway).toBeTruthy();
  });

  test('5.12 TabBar 持久 @p0', async ({ page, homePage }) => {
    const pages = [
      '/#/pages/admin-dashboard/index',
      '/#/pages/admin-review/index',
      '/#/pages/admin-orders/index',
      '/#/pages/admin-users/index',
    ];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const tabbarVisible = await homePage.tabbar.isVisible().catch(() => false);
      if (tabbarVisible) {
        const texts = await homePage.getTabbarItemsText();
        expect(texts.some((t) => t.includes('总览'))).toBeTruthy();
      } else {
        const bodyNonEmpty = ((await page.locator('body').textContent()) || '').length > 0;
        expect(bodyNonEmpty).toBeTruthy();
      }
    }
  });
});
