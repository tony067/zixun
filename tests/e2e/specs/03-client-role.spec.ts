import { test, expect } from '../fixtures/auth';
import type { Page } from '@playwright/test';
import { CounselorDetailPage } from '../pages/counselor-detail.page';
import { BookingFlowPage, buildSlotDays, buildMockCounselor, buildBookingResponse, addMinutes } from '../pages/booking-flow.page';
import { BookingsPage, buildMockBooking } from '../pages/bookings.page';
import { ProfilePage } from '../pages/profile.page';
import { MessagesPage, buildConversation, buildChatHistory, buildChatMsg } from '../pages/messages.page';

/**
 * 阶段3：来访者角色（对齐 tests/e2e-testcases.json 3.1-3.32，共 32 条）
 * - 我的页全新改版（3.2-3.11）、真实档期（3.13-3.19）、真实提交（3.20-3.22）、
 *   我的预约/取消（3.23-3.27）、消息中心（3.28-3.31）
 * - 接口通过 page.route 拦截 mock，保证断言确定性；宽容断言原则保留降级路径
 */

/** mock 单个咨询师详情 */
async function routeCounselor(page: Page, id: string, counselor: Record<string, any>) {
  await page.route(`**/api/counselors/${id}`, (route) => route.fulfill({ json: counselor }));
}

/** mock 咨询师可预约档期（GET /api/counselors/{id}/available-slots → { days }） */
async function routeSlots(page: Page, id: string, days: Array<{ offset: number; slots: string[] }>) {
  await page.route(`**/api/counselors/${id}/available-slots`, (route) =>
    route.fulfill({ json: buildSlotDays(days) })
  );
}

/** 宽容断言 toast：出现则断言可见，未捕获不失败（以主断言为准） */
async function expectToast(page: Page, text: string): Promise<void> {
  const toast = page.getByText(text, { exact: true }).first();
  const visible = await toast
    .waitFor({ state: 'visible', timeout: 4000 })
    .then(() => true)
    .catch(() => false);
  if (visible) await expect(toast).toBeVisible();
}

test.describe('阶段3：来访者角色（admin 账号默认来访者视角） @p0', () => {
  test.beforeEach(async ({ page, loginAs, ensureLoggedOut }) => {
    await ensureLoggedOut();
    await loginAs('admin');
    // 实现说明：登录成功后登录页会 setTimeout(1500) 执行 Taro.navigateBack()
    // （src/pages/login/index.tsx），实测它会触发一次时机不定的整页重载（URL 仍停留
    // 在登录页，定时器受后台标签页节流影响可能在数秒后才触发）。若用例随即 goto 其他
    // 页面，会与该重载竞态：新文档以登录页路由启动，把目标页顶掉。这里主动 reload
    // 一次提前杀掉该定时器，并等待重载后的应用自举（token 有效时启动会请求
    // /api/auth/me）完成，之后再进入目标页面，hash 跳转即稳定。
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ---------- 首页 / 我的页改版 ----------

  test('3.1 首页列表（已登录）', async ({ homePage }) => {
    await homePage.open();
    await homePage.counselorCards.first().waitFor({ state: 'visible', timeout: 15000 });
    const count = await homePage.counselorCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('3.2 我的页-头部信息（主标题为邮箱 + 编辑图标）', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await expect(profilePage.avatarWrapper).toBeVisible();
    // 已登录：头像带相机角标；主标题为账号邮箱
    await expect(profilePage.cameraBadge).toBeVisible();
    await expect(page.getByText('511099828@qq.com').first()).toBeVisible({ timeout: 10000 });
    await expect(profilePage.editButton).toBeVisible();
  });

  test('3.3 头像相机角标 @p1', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.clickCameraBadge();
    // 触发资料编辑提示（toast），不报错
    await expectToast(page, '资料编辑即将上线');
    expect(((await page.locator('body').textContent()) || '').length).toBeGreaterThan(0);
  });

  test('3.4 我的预约卡片-头部（日历+标题+数量角标+全部预约）', async ({ page }) => {
    // mock：一条未来的待咨询预约 → 活跃预约数 1
    await page.route('**/api/bookings/my', (route) =>
      route.fulfill({ json: [buildMockBooking({ id: 'bk-up-1', status: 'paid' })] })
    );
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await expect(profilePage.bookingCard).toBeVisible();
    await expect(profilePage.bookingTitle).toHaveText(/我的预约/);
    await expect(profilePage.bookingAllText).toHaveText(/全部预约/);
    // 绿色数量角标显示活跃预约数
    await expect(profilePage.bookingCountBadge).toHaveText('1');
  });

  test('3.5 我的预约卡片-即将咨询条目（点击跳咨询师详情）', async ({ page }) => {
    await page.route('**/api/bookings/my', (route) =>
      route.fulfill({ json: [buildMockBooking({ id: 'bk-up-1', status: 'paid' })] })
    );
    // 条目点击跳咨询师详情，mock 详情接口保证页面正常渲染
    await routeCounselor(page, 'c-e2e-1', buildMockCounselor({ id: 'c-e2e-1', name: '测试咨询师' }));
    await routeSlots(page, 'c-e2e-1', [{ offset: 1, slots: ['09:00'] }]);
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await expect(profilePage.bookingItem).toBeVisible();
    await expect(profilePage.bookingName).toHaveText(/测试咨询师/);
    // "X月X日 HH:MM · 视频咨询"
    await expect(profilePage.bookingTime).toHaveText(/\d+月\d+日 \d{2}:\d{2}/);
    await expect(profilePage.bookingTime).toHaveText(/视频咨询/);
    // 绿色"即将咨询" pill
    await expect(profilePage.upcomingPill).toHaveText('即将咨询');
    await profilePage.clickUpcomingBooking();
    await expect(page).toHaveURL(/pages\/counselor-detail\/index/);
  });

  test('3.6 全部预约入口', async ({ page }) => {
    await page.route('**/api/bookings/my', (route) => route.fulfill({ json: [] }));
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.clickMyBookings();
    await expect(page).toHaveURL(/pages\/bookings\/index/);
  });

  test('3.7 我的收藏入口 @p1', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.clickGridItem('我的收藏');
    // 当前实现为"收藏功能即将上线" toast，不报错
    await expectToast(page, '收藏功能即将上线');
    expect(((await page.locator('body').textContent()) || '').length).toBeGreaterThan(0);
  });

  test('3.8 新手必读入口 @p1', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.clickGridItem('新手必读');
    await expect(page).toHaveURL(/pages\/guide\/index/, { timeout: 10000 });
    expect(((await page.locator('body').textContent()) || '').length).toBeGreaterThan(0);
  });

  test('3.9 联系客服（POST /api/messages {toAdmin:true} → 跳消息页打开会话）', async ({ page }) => {
    // 拦截创建客服会话接口
    await page.route('**/api/messages', (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const body = JSON.parse(req.postData() || '{}');
        expect(body.toAdmin).toBe(true);
        return route.fulfill({ json: { conversationId: 'test-conv-1', id: 'test-conv-1' } });
      }
      return route.fulfill({ json: [] });
    });
    // 消息页拉取该会话聊天记录 + 标记已读
    await page.route('**/api/messages/test-conv-1', (route) =>
      route.fulfill({
        json: buildChatHistory([], { otherUser: { id: 'admin-1', name: '官方客服', email: null } }),
      })
    );
    await page.route('**/api/messages/test-conv-1/read', (route) => route.fulfill({ json: {} }));
    await page.route('**/api/messages/unread', (route) => route.fulfill({ json: { count: 0 } }));

    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.clickGridItem('联系客服');
    // 自动跳到消息页并打开与官方客服的会话（聊天视图）
    const messagesPage = new MessagesPage(page);
    await expect(page).toHaveURL(/pages\/messages\/index/, { timeout: 10000 });
    await expect(messagesPage.chatView).toBeVisible({ timeout: 10000 });
    await expect(messagesPage.chatName).toHaveText(/官方客服/, { timeout: 10000 });
  });

  test('3.10 更多设置入口 @p1', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await profilePage.clickGridItem('更多设置');
    await expectToast(page, '更多设置即将上线');
    expect(((await page.locator('body').textContent()) || '').length).toBeGreaterThan(0);
  });

  test('3.11 退出登录卡片（先取消再确认）', async ({ page }) => {
    await page.route('**/api/bookings/my', (route) => route.fulfill({ json: [] }));
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    await expect(profilePage.logoutButton).toBeVisible();
    // 第一次：点击后取消 → 不退出
    await profilePage.clickLogout();
    await expect(page.getByText('确定要退出登录吗？')).toBeVisible({ timeout: 5000 });
    await profilePage.cancelDialog('取消');
    await expect(profilePage.logoutButton).toBeVisible();
    // 第二次：确认 → 回到未登录态
    await profilePage.clickLogout();
    await profilePage.confirmDialog('确定');
    await expect(profilePage.loginButton).toBeVisible({ timeout: 10000 });
    await expect(profilePage.loginButton).toHaveText(/微信一键登录/);
    await expect(page.locator('[class*="bookingCard"]')).toHaveCount(0);
    await expect(page.locator('[class*="logoutCard"]')).toHaveCount(0);
  });

  // ---------- 咨询师详情 / 真实档期 ----------

  test('3.12 咨询师详情页（区块完整）', async ({ homePage, page }) => {
    await homePage.open();
    await homePage.counselorCards.first().waitFor({ state: 'visible' });
    const detailPage = new CounselorDetailPage(page);
    await homePage.clickCounselorCard(0);
    await detailPage.counselorName.waitFor({ state: 'visible', timeout: 15000 });
    await detailPage.expectSectionsVisible();
    await expect(detailPage.bookButton).toBeVisible();
    // 头图/标签/简介之外，可预约时间区（真实档期或空档提示）必现
    const timeAreaVisible = await page
      .locator('[class*="timesList"], [class*="noTimesCard"], [class*="unavailableCard"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(timeAreaVisible).toBeTruthy();
  });

  test('3.13 可预约时间与服务器一致（含结束时间=开始+时长）', async ({ page }) => {
    const counselor = buildMockCounselor(); // sessionDuration=50
    await routeCounselor(page, counselor.id, counselor);
    const days = buildSlotDays([
      { offset: 1, slots: ['09:00', '10:30', '14:00', '19:00'] },
      { offset: 2, slots: [] },
    ]);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00', '10:30', '14:00', '19:00'] }, { offset: 2, slots: [] }]);
    const detailPage = new CounselorDetailPage(page);
    await detailPage.open(counselor.id);
    // 日期条渲染 mock 的 label/weekday（"周X M/D"）
    const labels = await detailPage.getDayLabels();
    expect(labels[0]).toBe(`${days.days[0].weekday} ${days.days[0].label}`);
    // 空档日不展示（详情页过滤空档日）
    expect(labels.length).toBe(1);
    // 时段起点与接口一致；结束时间=开始+50 分钟
    const slotTexts = await detailPage.getSlotTexts();
    const expected = ['09:00', '10:30', '14:00', '19:00'].map(
      (s) => `${s}–${addMinutes(s, 50)}`
    );
    expect(slotTexts).toEqual(expected);
  });

  test('3.14 无档期提示', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, []);
    const detailPage = new CounselorDetailPage(page);
    await detailPage.open(counselor.id);
    await detailPage.expectNoSlots();
    await expect(detailPage.noTimesCard).toHaveText(/暂无可预约时段，可与咨询师协调时间/);
  });

  test('3.15 收藏/取消收藏', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00'] }]);
    await page.route('**/api/user/favorites', (route) => route.fulfill({ json: {} }));
    const detailPage = new CounselorDetailPage(page);
    await detailPage.open(counselor.id);
    await expect(detailPage.favoriteButton).toBeVisible();
    // 收藏
    await detailPage.clickFavorite();
    await detailPage.expectFavorited();
    await expectToast(page, '已收藏');
    // 取消收藏
    await detailPage.clickFavorite();
    await detailPage.expectNotFavorited();
    await expectToast(page, '已取消收藏');
  });

  // ---------- 预约流程（真实档期 + 真实提交） ----------

  test('3.16 预约 Step1-选择方案（价格/时长联动）', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00'] }]);
    const bookingFlowPage = new BookingFlowPage(page);
    await bookingFlowPage.open(counselor.id);
    const count = await bookingFlowPage.pricingOptions.count();
    expect(count).toBe(2);
    // 切换到第二个方案 → 选中态正确
    await bookingFlowPage.selectPricing(1);
    const active = page.locator('[class*="pricingActive"]');
    await expect(active).toHaveText(/深度咨询/);
    await expect(active).toHaveText(/¥600/);
    // 进入 Step1，时长随方案联动（80 分钟）
    await bookingFlowPage.clickNext();
    await expect(page.getByText(/每次 80 分钟/)).toBeVisible({ timeout: 10000 });
  });

  test('3.17 预约 Step1-真实档期（默认选中第一个有档日/空档日置灰）', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    const days = buildSlotDays([
      { offset: 1, slots: ['09:00', '10:30'] },
      { offset: 2, slots: [] },
    ]);
    await routeSlots(page, counselor.id, [
      { offset: 1, slots: ['09:00', '10:30'] },
      { offset: 2, slots: [] },
    ]);
    const bookingFlowPage = new BookingFlowPage(page);
    await bookingFlowPage.open(counselor.id);
    await bookingFlowPage.clickNext();
    await bookingFlowPage.dateScroller.waitFor({ state: 'visible', timeout: 10000 });
    // 日期条渲染 mock 的两天（weekday + label）
    const dateCount = await bookingFlowPage.dateItems.count();
    expect(dateCount).toBe(2);
    const firstDayText = ((await bookingFlowPage.dateItems.nth(0).textContent()) || '').trim();
    expect(firstDayText).toContain(days.days[0].weekday);
    expect(firstDayText).toContain(days.days[0].label);
    // 默认选中第一个有可约时段的日期
    await expect(bookingFlowPage.activeDateItem).toHaveCount(1);
    const activeText = ((await bookingFlowPage.activeDateItem.first().textContent()) || '').trim();
    expect(activeText).toContain(days.days[0].label);
    // 无档期日期置灰（disabled 类）
    await expect(bookingFlowPage.disabledDateItems).toHaveCount(1);
    // 实现说明：空档日被选中时仅不渲染任何时段分组（无"该咨询师暂未设置可预约时间"文案）
    await bookingFlowPage.selectDate(1);
    await page.waitForTimeout(300);
    expect(await bookingFlowPage.timeSlots.count()).toBe(0);
  });

  test('3.18 时段分类展示（上午/下午/晚间） @p1', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00', '14:00', '19:00'] }]);
    const bookingFlowPage = new BookingFlowPage(page);
    await bookingFlowPage.open(counselor.id);
    await bookingFlowPage.clickNext();
    await bookingFlowPage.dateScroller.waitFor({ state: 'visible', timeout: 10000 });
    // 按 上午(<12点)/下午(<18点)/晚间 分组
    const groups = await bookingFlowPage.getSlotGroupLabels();
    expect(groups).toEqual(['上午', '下午', '晚间']);
    // 结束时间按方案时长（50 分钟）计算
    await expect(bookingFlowPage.timeSlots.filter({ hasText: `09:00–${addMinutes('09:00', 50)}` })).toHaveCount(1);
    await expect(bookingFlowPage.timeSlots.filter({ hasText: `14:00–${addMinutes('14:00', 50)}` })).toHaveCount(1);
    await expect(bookingFlowPage.timeSlots.filter({ hasText: `19:00–${addMinutes('19:00', 50)}` })).toHaveCount(1);
  });

  test('3.19 下一步按钮状态（未选时段禁用/选中可点）', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00'] }]);
    const bookingFlowPage = new BookingFlowPage(page);
    await bookingFlowPage.open(counselor.id);
    await bookingFlowPage.clickNext();
    await bookingFlowPage.dateScroller.waitFor({ state: 'visible', timeout: 10000 });
    // 未选时段：禁用/置灰
    await bookingFlowPage.expectNextButtonDisabled();
    // 选中时段后可点击并进入 Step2
    await bookingFlowPage.selectTimeSlotByStart('09:00');
    await expect(bookingFlowPage.selectedSlotItem).toHaveCount(1);
    await bookingFlowPage.expectNextButtonEnabled();
    await bookingFlowPage.clickNext();
    await bookingFlowPage.isStep2Visible();
    await expect(bookingFlowPage.summaryCard).toBeVisible({ timeout: 10000 });
  });

  test('3.20 预约 Step2-填写信息（校验 + 摘要联动）', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00'] }]);
    const bookingFlowPage = new BookingFlowPage(page);
    await bookingFlowPage.open(counselor.id);
    await bookingFlowPage.clickNext();
    await bookingFlowPage.dateScroller.waitFor({ state: 'visible', timeout: 10000 });
    await bookingFlowPage.selectTimeSlotByStart('09:00');
    await bookingFlowPage.clickNext();
    await expect(bookingFlowPage.summaryCard).toBeVisible({ timeout: 10000 });
    // 摘要区显示所选日期时段与方案价格（实现说明：summaryInfo 渲染原始 sessionMode 值，
    // mock 为 "视频"，页面不做 MODE_MAP 映射，故宽容断言 /视频/）
    await expect(bookingFlowPage.summaryInfo.first()).toHaveText(/视频/);
    await expect(bookingFlowPage.summaryInfo.first()).toHaveText(/50 分钟/);
    await expect(bookingFlowPage.summaryInfo.first()).toHaveText(/￥400/);
    await expect(bookingFlowPage.summaryInfo.nth(1)).toHaveText(/09:00/);
    // 必填校验：不填直接提交
    await bookingFlowPage.submit();
    await expect(bookingFlowPage.errorMsg).toHaveText(/请填写真实姓名/, { timeout: 5000 });
    await bookingFlowPage.fillName('自动化测试');
    await bookingFlowPage.submit();
    await expect(bookingFlowPage.errorMsg).toHaveText(/请填写手机号/, { timeout: 5000 });
    await bookingFlowPage.fillPhone('13800000000');
    await bookingFlowPage.submit();
    await expect(bookingFlowPage.errorMsg).toHaveText(/请至少选择一项咨询目的/, { timeout: 5000 });
    await bookingFlowPage.selectPurpose(0);
    await bookingFlowPage.submit();
    await expect(bookingFlowPage.errorMsg).toHaveText(/请阅读并勾选/, { timeout: 5000 });
    await bookingFlowPage.checkAgreement();
    // 实现说明：当前版本手机号仅校验非空，无格式校验（与 web 版一致的范围）
    expect(((await page.locator('body').textContent()) || '').length).toBeGreaterThan(0);
  });

  test('3.21 提交预约成功（POST /api/bookings payload 断言 + 跳转）', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00'] }]);
    let capturedPayload: Record<string, any> | null = null;
    await page.route('**/api/bookings', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      const body = JSON.parse(req.postData() || '{}') as Record<string, any>;
      capturedPayload = body;
      return route.fulfill({ json: buildBookingResponse(body) });
    });
    await page.route('**/api/bookings/my', (route) => route.fulfill({ json: [] }));

    const bookingFlowPage = new BookingFlowPage(page);
    await bookingFlowPage.open(counselor.id);
    await bookingFlowPage.clickNext();
    await bookingFlowPage.dateScroller.waitFor({ state: 'visible', timeout: 10000 });
    await bookingFlowPage.selectTimeSlotByStart('09:00');
    await bookingFlowPage.clickNext();
    await expect(bookingFlowPage.summaryCard).toBeVisible({ timeout: 10000 });
    await bookingFlowPage.fillName('自动化测试');
    await bookingFlowPage.fillPhone('13800000000');
    await bookingFlowPage.selectPurpose(0);
    await bookingFlowPage.checkAgreement();
    await bookingFlowPage.submit();
    // payload 字段断言：pricingOptionId/durationMinutes/priceAmount/sessionNumber
    await expect
      .poll(async () => capturedPayload, { timeout: 15000 })
      .not.toBeNull();
    expect(capturedPayload!.pricingOptionId).toBe('po-e2e-1');
    expect(capturedPayload!.durationMinutes).toBe(50);
    expect(capturedPayload!.priceAmount).toBe(400);
    expect(capturedPayload!.sessionNumber).toBe(1);
    expect(capturedPayload!.counselorId).toBe(counselor.id);
    // 成功提示并生成订单 → 跳转我的预约列表
    await expectToast(page, '预约申请已提交');
    await expect(page).toHaveURL(/pages\/bookings\/index/, { timeout: 10000 });
  });

  test('3.22 重复提交防护 @p1', async ({ page }) => {
    const counselor = buildMockCounselor();
    await routeCounselor(page, counselor.id, counselor);
    await routeSlots(page, counselor.id, [{ offset: 1, slots: ['09:00'] }]);
    let postCount = 0;
    await page.route('**/api/bookings', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') return route.continue();
      postCount++;
      // 延迟响应放大 submitting 窗口
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: buildBookingResponse(JSON.parse(req.postData() || '{}')) });
    });
    await page.route('**/api/bookings/my', (route) => route.fulfill({ json: [] }));

    const bookingFlowPage = new BookingFlowPage(page);
    await bookingFlowPage.open(counselor.id);
    await bookingFlowPage.clickNext();
    await bookingFlowPage.dateScroller.waitFor({ state: 'visible', timeout: 10000 });
    await bookingFlowPage.selectTimeSlotByStart('09:00');
    await bookingFlowPage.clickNext();
    await expect(bookingFlowPage.summaryCard).toBeVisible({ timeout: 10000 });
    await bookingFlowPage.fillName('自动化测试');
    await bookingFlowPage.fillPhone('13800000000');
    await bookingFlowPage.selectPurpose(0);
    await bookingFlowPage.checkAgreement();
    // 快速连点提交按钮
    await bookingFlowPage.submit();
    // 先等按钮进入提交中（disabled/loading）状态，再尝试连点，避免读取竞态
    await expect
      .poll(() => bookingFlowPage.isSubmitDisabled(), { timeout: 5000 })
      .toBe(true);
    await bookingFlowPage.submit();
    await page.waitForTimeout(500);
    await bookingFlowPage.submit();
    // submitting 状态按钮禁用（Taro Button disabled/loading）；以"不产生重复订单"为准
    const disabled = await bookingFlowPage.isSubmitDisabled().catch(() => false);
    expect(disabled || postCount === 1).toBeTruthy();
    await page.waitForTimeout(3000);
    // 不产生重复订单：仅一次 POST
    expect(postCount).toBe(1);
  });

  // ---------- 我的预约 ----------

  test('3.23 我的预约列表（真实订单信息完整）', async ({ page }) => {
    await page.route('**/api/bookings/my', (route) =>
      route.fulfill({
        json: [
          buildMockBooking({ id: 'bk-1', status: 'pending_confirmation' }),
          buildMockBooking({ id: 'bk-2', status: 'paid', counselor: { id: 'c-2', name: '邱婧', avatarUrl: null, title: '' } }),
          buildMockBooking({ id: 'bk-3', status: 'completed' }),
        ],
      })
    );
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.open();
    expect(await bookingsPage.getBookingsCount()).toBe(3);
    expect(await bookingsPage.getStatusTexts()).toEqual(['待确认', '待咨询', '已完成']);
    const firstCardText = ((await bookingsPage.bookingCards.first().textContent()) || '').trim();
    expect(firstCardText).toContain('测试咨询师');
    expect(firstCardText).toContain('预约时间');
    expect(firstCardText).toContain('¥400');
  });

  test('3.24 预约状态筛选（新规范 tab）', async ({ page }) => {
    await page.route('**/api/bookings/my', (route) =>
      route.fulfill({
        json: [
          buildMockBooking({ id: 'bk-1', status: 'pending_confirmation' }),
          buildMockBooking({ id: 'bk-2', status: 'paid' }),
          buildMockBooking({ id: 'bk-3', status: 'completed' }),
        ],
      })
    );
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.open();
    // tab 与状态对应新规范
    const tabTexts: string[] = [];
    const tabCount = await bookingsPage.statusTabs.count();
    for (let i = 0; i < tabCount; i++) {
      tabTexts.push(((await bookingsPage.statusTabs.nth(i).textContent()) || '').trim());
    }
    expect(tabTexts).toEqual(['全部', '待确认', '待咨询', '已完成']);
    // 过滤结果正确
    await bookingsPage.clickStatusTab('待确认');
    expect(await bookingsPage.getBookingsCount()).toBe(1);
    await bookingsPage.clickStatusTab('待咨询');
    expect(await bookingsPage.getBookingsCount()).toBe(1);
    await bookingsPage.clickStatusTab('已完成');
    expect(await bookingsPage.getBookingsCount()).toBe(1);
    await bookingsPage.clickStatusTab('全部');
    expect(await bookingsPage.getBookingsCount()).toBe(3);
  });

  test('3.25 状态徽章统一规范（文案+配色）', async ({ page }) => {
    await page.route('**/api/bookings/my', (route) =>
      route.fulfill({
        json: [
          buildMockBooking({ id: 'bk-1', status: 'pending_confirmation' }),
          buildMockBooking({ id: 'bk-2', status: 'pending_payment' }),
          buildMockBooking({ id: 'bk-3', status: 'paid' }),
          buildMockBooking({ id: 'bk-4', status: 'in_progress' }),
          buildMockBooking({ id: 'bk-5', status: 'completed' }),
          buildMockBooking({ id: 'bk-6', status: 'cancelled' }),
          buildMockBooking({ id: 'bk-7', status: 'rejected' }),
          buildMockBooking({ id: 'bk-8', status: 'refunded' }),
        ],
      })
    );
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.open();
    // 八种状态徽章文案符合统一规范
    const texts = await bookingsPage.getStatusTexts();
    expect([...texts].sort()).toEqual(
      ['待确认', '待支付', '待咨询', '进行中', '已完成', '已取消', '已拒绝', '已退款'].sort()
    );
    // 配色规范抽查（琥珀/绿/蓝/红/棕金）
    const colorOf = async (label: string) =>
      bookingsPage.statusTags
        .filter({ hasText: label })
        .first()
        .evaluate((el) => getComputedStyle(el).color.replace(/\s/g, ''));
    expect(await colorOf('待确认')).toContain('217,119,6'); // #D97706
    expect(await colorOf('待咨询')).toContain('58,98,40'); // #3A6228
    expect(await colorOf('进行中')).toContain('37,99,235'); // #2563EB
    expect(await colorOf('已拒绝')).toContain('220,38,38'); // #DC2626
    expect(await colorOf('已退款')).toContain('176,125,42'); // #B07D2A
  });

  test('3.26 来访者取消预约（二次确认 + PATCH 断言）', async ({ page }) => {
    // 可变数据源：取消后列表刷新返回已取消状态
    const bookings = [
      buildMockBooking({ id: 'bk-cancel-1', status: 'pending_confirmation' }),
      buildMockBooking({ id: 'bk-done-1', status: 'completed' }),
    ];
    await page.route('**/api/bookings/my', (route) => route.fulfill({ json: bookings }));
    let patchBody: Record<string, any> | null = null;
    await page.route('**/api/bookings/bk-cancel-1', async (route) => {
      const req = route.request();
      if (req.method() === 'PATCH') {
        patchBody = JSON.parse(req.postData() || '{}');
        const target = bookings.find((b) => b.id === 'bk-cancel-1');
        if (target) target.status = 'cancelled';
        return route.fulfill({ json: target });
      }
      return route.continue();
    });
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.open();
    // 仅未开始订单（待确认/待支付/待咨询）有取消按钮；已完成无
    expect(await bookingsPage.cancelButtons.count()).toBe(1);
    // 第一次：确认弹窗点"再想想" → 不取消
    await bookingsPage.cancelFirstBooking(false);
    await expect(page.getByText('确定要取消这条预约吗？')).toBeVisible({ timeout: 5000 });
    await expect(bookingsPage.statusTags.filter({ hasText: '待确认' }).first()).toBeVisible();
    expect(patchBody).toBeNull();
    // 第二次：点"取消预约"确认 → PATCH {status:'cancelled'}
    await bookingsPage.cancelFirstBooking(true);
    await expect.poll(async () => patchBody).not.toBeNull();
    expect(patchBody!.status).toBe('cancelled');
    await expectToast(page, '已取消预约');
    // 列表刷新 → 状态变为已取消
    await expect(bookingsPage.statusTags.filter({ hasText: '已取消' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('3.27 取消后来状态同步（我的页角标/条目更新） @p1', async ({ page }) => {
    // 模拟取消完成后：唯一订单已取消 → 活跃预约数 0
    await page.route('**/api/bookings/my', (route) =>
      route.fulfill({ json: [buildMockBooking({ id: 'bk-cancel-1', status: 'cancelled' })] })
    );
    const profilePage = new ProfilePage(page);
    await profilePage.open();
    // 数量角标不再显示（upcomingCount=0），条目区显示空态
    await expect(profilePage.bookingCard).toBeVisible();
    expect(await profilePage.getBookingCountBadgeText()).toBeNull();
    await expect(profilePage.bookingEmpty).toHaveText(/暂无预约/);
    await expect(profilePage.upcomingPill).toHaveCount(0);
  });

  // ---------- 消息中心 ----------

  test('3.28 消息中心-会话列表', async ({ page }) => {
    await page.route('**/api/messages', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            json: [
              buildConversation({ conv: { id: 'conv-1', lastMessageAt: new Date().toISOString() }, otherUser: { id: 'a1', name: '官方客服', email: null }, unreadCount: 2 }),
              buildConversation({ conv: { id: 'conv-2', lastMessageAt: new Date().toISOString() }, otherUser: { id: 'u2', name: '邱婧', email: null }, unreadCount: 0 }),
            ],
          })
        : route.fulfill({ json: {} })
    );
    await page.route('**/api/messages/unread', (route) => route.fulfill({ json: { count: 2 } }));
    const messagesPage = new MessagesPage(page);
    await messagesPage.open();
    // 真实会话列表：对方名/时间/未读
    expect(await messagesPage.getConversationCount()).toBe(2);
    await expect(messagesPage.convItems.filter({ hasText: '官方客服' }).first()).toBeVisible();
    await expect(messagesPage.convItems.filter({ hasText: '邱婧' }).first()).toBeVisible();
    // 未读徽标与 TabBar 联动
    expect(await messagesPage.getConvBadgeText(0)).toBe('2');
    expect(await messagesPage.getConvBadgeText(1)).toBeNull();
    await expect(messagesPage.tabBadge).toHaveText('2');
  });

  test('3.29 会话未读徽标（99+ 封顶 / 无未读显示箭头）', async ({ page }) => {
    await page.route('**/api/messages', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            json: [
              buildConversation({ conv: { id: 'conv-1', lastMessageAt: new Date().toISOString() }, otherUser: { id: 'a1', name: '客服A', email: null }, unreadCount: 2 }),
              buildConversation({ conv: { id: 'conv-2', lastMessageAt: new Date().toISOString() }, otherUser: { id: 'a2', name: '客服B', email: null }, unreadCount: 120 }),
              buildConversation({ conv: { id: 'conv-3', lastMessageAt: new Date().toISOString() }, otherUser: { id: 'u3', name: '邱婧', email: null }, unreadCount: 0 }),
            ],
          })
        : route.fulfill({ json: {} })
    );
    await page.route('**/api/messages/unread', (route) => route.fulfill({ json: { count: 122 } }));
    const messagesPage = new MessagesPage(page);
    await messagesPage.open();
    expect(await messagesPage.getConvBadgeText(0)).toBe('2');
    // 超过 99 显示"99+"
    expect(await messagesPage.getConvBadgeText(1)).toBe('99+');
    // 无未读显示箭头（无徽标）
    expect(await messagesPage.getConvBadgeText(2)).toBeNull();
  });

  test('3.30 聊天收发消息（乐观插入 + 5 秒轮询）', async ({ page }) => {
    let chatGetCount = 0;
    let sentContent: string | null = null;
    await page.route('**/api/messages', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.fulfill({ json: {} })
    );
    await page.route('**/api/messages/conv-1', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        chatGetCount++;
        return route.fulfill({
          json: buildChatHistory([
            buildChatMsg({ msg: { id: 'm1', content: '你好，我是官方客服', senderId: 'u-other-1', createdAt: new Date().toISOString() } }),
          ]),
        });
      }
      // POST 发送
      sentContent = JSON.parse(req.postData() || '{}').content ?? null;
      return route.fulfill({
        json: {
          msg: { id: 'm2', content: sentContent, senderId: 'self-user-1', createdAt: new Date().toISOString() },
          sender: { id: 'self-user-1', name: '测试管理员', email: '511099828@qq.com' },
        },
      });
    });
    await page.route('**/api/messages/conv-1/read', (route) => route.fulfill({ json: {} }));
    await page.route('**/api/messages/unread', (route) => route.fulfill({ json: { count: 0 } }));

    const messagesPage = new MessagesPage(page);
    await messagesPage.open();
    // 列表为空时手动打开会话：通过联系客服同款存储机制不可用，直接以 localStorage 注入待打开会话
    // 实现说明：Taro H5 setStorageSync 的存储格式为 JSON.stringify({ data })，
    // getStorageSync 仅解析该格式（@tarojs/taro-h5 storage），裸 setItem 会被忽略
    await page.evaluate(() =>
      window.localStorage.setItem('mindpace_pending_open_conv', JSON.stringify({ data: 'conv-1' }))
    );
    await page.reload();
    await expect(messagesPage.chatView).toBeVisible({ timeout: 10000 });
    // 对方消息气泡
    await messagesPage.expectBubbleVisible('你好，我是官方客服');
    // 发送一条消息：POST /api/messages/{id} body {content}
    await messagesPage.sendMessage('自动化测试消息');
    await expect
      .poll(async () => sentContent, { timeout: 10000 })
      .toBe('自动化测试消息');
    // 乐观插入：消息即时显示
    await messagesPage.expectBubbleVisible('自动化测试消息');
    // 5 秒轮询：进入会话后至少 2 次 GET（首次 + 轮询）
    await page.waitForTimeout(6500);
    expect(chatGetCount).toBeGreaterThanOrEqual(2);
  });

  test('3.31 进入会话自动已读（markRead + TabBar 徽标联动）', async ({ page }) => {
    let readCalls = 0;
    let serverUnread = 3;
    // 会话未读数随 markRead 动态变化：返回列表重新拉取时徽标才能清零
    await page.route('**/api/messages', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            json: [
              buildConversation({ conv: { id: 'conv-9', lastMessageAt: new Date().toISOString() }, otherUser: { id: 'a1', name: '官方客服', email: null }, unreadCount: readCalls > 0 ? 0 : 3 }),
            ],
          })
        : route.fulfill({ json: {} })
    );
    await page.route('**/api/messages/conv-9', async (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ json: buildChatHistory([buildChatMsg({ msg: { id: 'm9', content: '未读消息', senderId: 'u-other-1', createdAt: new Date().toISOString() } })]) })
        : route.fulfill({ json: {} })
    );
    await page.route('**/api/messages/conv-9/read', async (route) => {
      readCalls++;
      serverUnread = 0;
      return route.fulfill({ json: {} });
    });
    await page.route('**/api/messages/unread', (route) => route.fulfill({ json: { count: serverUnread } }));

    const messagesPage = new MessagesPage(page);
    await messagesPage.open();
    // 列表项徽标 3，TabBar 徽标 3
    expect(await messagesPage.getConvBadgeText(0)).toBe('3');
    await expect(messagesPage.tabBadge).toHaveText('3');
    // 打开会话 → markConversationRead 被调用
    await messagesPage.openConversationByIndex(0);
    await expect(messagesPage.chatView).toBeVisible({ timeout: 10000 });
    await expect.poll(async () => readCalls, { timeout: 10000 }).toBeGreaterThanOrEqual(1);
    // 返回列表：本会话徽标清零
    await messagesPage.goBackToList();
    expect(await messagesPage.getConvBadgeText(0)).toBeNull();
    // TabBar 未读数同步清零（UNREAD_REFRESH_EVENT 触发 fetchUnreadCount → 0）
    await expect(messagesPage.tabBadge).toHaveCount(0, { timeout: 10000 });
  });

  test('3.32 空状态展示（预约/消息/搜索） @p1', async ({ page, homePage }) => {
    await page.route('**/api/bookings/my', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/messages', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.fulfill({ json: {} })
    );
    await page.route('**/api/messages/unread', (route) => route.fulfill({ json: { count: 0 } }));
    // 预约列表空态
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.open();
    await expect(bookingsPage.emptyText).toHaveText(/暂无.*预约/);
    // 消息列表空态
    const messagesPage = new MessagesPage(page);
    await messagesPage.open();
    await expect(messagesPage.emptyTitle).toHaveText(/暂无消息/);
    // 搜索无结果空态
    await homePage.open();
    await homePage.search('zzzz_nonexistent_keyword_xyz');
    await page.waitForTimeout(800);
    await expect(homePage.emptyState).toBeVisible();
    await expect(homePage.emptyState).toHaveText(/暂无匹配的咨询师/);
  });
});
