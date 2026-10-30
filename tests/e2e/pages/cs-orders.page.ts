import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface MockAdminOrder {
  id: string;
  client: { name: string };
  counselor: { displayName: string; name?: string };
  sessionMode?: string;
  scheduledAt?: string;
  priceAmount?: number;
  status: string;
}

export interface StatusPatchCall {
  id: string;
  status: string;
}

/** 客服允许的操作范围（与 src/pages/cs-orders/index.tsx CAN_MARK_PAID / CAN_REFUND 一致） */
export const CS_CAN_MARK_PAID = ['pending_payment', 'confirmed'];
export const CS_CAN_REFUND = ['pending_confirmation', 'pending_payment', 'paid', 'in_progress', 'completed'];

/**
 * 客服工作台（/pages/cs-orders/index）POM
 * 入口：登录 admin → switchToRole('support') → TabBar"工作台"
 * GET /api/admin/orders 拉取订单（admin/support 可调用）；仅"标记已支付"与"退款"两种操作
 */
export class CsOrdersPage extends BasePage {
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly roleBadge: Locator;
  readonly orderCards: Locator;
  readonly statusBadges: Locator;
  readonly payButtons: Locator;
  readonly refundButtons: Locator;
  readonly unauthorizedTip: Locator;
  readonly emptyTip: Locator;
  readonly tabbar: Locator;

  /** PATCH 请求捕获（id + payload.status） */
  readonly patchCalls: StatusPatchCall[] = [];

  private orders: MockAdminOrder[] = [];

  constructor(page: Page) {
    super(page);
    // 页面内 header 的标题；getByText 会命中隐藏的 taro-navigation-bar-title（自定义导航下 hidden），
    // 因此用 class 定位并只取可见元素，排除导航栏标题
    this.title = page
      .locator('[class*="title"]')
      .filter({ hasText: '客服工作台' })
      .filter({ visible: true })
      .first();
    // 副标题"共 N 笔订单"
    this.subtitle = page.locator('[class*="subtitle"]').filter({ hasText: '笔订单' }).first();
    // 身份徽章"客服 · 订单促进"
    this.roleBadge = page.locator('[class*="roleBadge"]').first();
    // Taro H5 页面栈保留 stale 隐藏页面，订单卡片/提示只统计可见实例
    this.orderCards = page.locator('[class*="orderCard"]').filter({ visible: true });
    // 状态徽章：index-module__orderStatus___<hash>（文案/配色来自 getBookingStatusMeta）
    this.statusBadges = page.locator('[class*="orderStatus"]');
    // 排除 payButtonText/refundButtonText 文本子元素（[class*="payButton"] 会同时命中两者导致计数翻倍）
    this.payButtons = page.locator('[class*="payButton"]:not([class*="payButtonText"])').filter({ visible: true });
    this.refundButtons = page.locator('[class*="refundButton"]:not([class*="refundButtonText"])').filter({ visible: true });
    this.unauthorizedTip = page
      .getByText('请切换到客服角色', { exact: false })
      .filter({ visible: true })
      .first();
    this.emptyTip = page.getByText(/暂无订单|加载中…/).first();
    this.tabbar = page.locator('[class*="tabbar"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/cs-orders/index');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 拦截订单接口，用可变 mock 数据保证可重复：
   * - GET /api/admin/orders 返回当前 state（PATCH 成功后同步更新，模拟列表刷新）
   * - PATCH /api/bookings/{id} 记录 payload.status 并按 options 决定成功/失败
   */
  async mockOrders(
    initial: MockAdminOrder[],
    options: { patchStatus?: number; patchBody?: Record<string, unknown> } = {}
  ): Promise<void> {
    this.orders = initial.map((o) => ({ ...o, client: { ...o.client }, counselor: { ...o.counselor } }));
    this.patchCalls.length = 0;
    const page = this.page;

    // PATCH /api/bookings/{id}（updateBookingStatus 走这里）
    await page.route('**/api/bookings/**', async (route) => {
      const req = route.request();
      if (req.method() !== 'PATCH') return route.fallback();
      const id = (req.url().match(/\/api\/bookings\/([^/?#]+)/) || [])[1] || '';
      const body = (req.postDataJSON() || {}) as { status?: string };
      this.patchCalls.push({ id, status: body.status || '' });
      if (options.patchStatus && options.patchStatus !== 200) {
        await route.fulfill({
          status: options.patchStatus,
          contentType: 'application/json',
          body: JSON.stringify(
            options.patchBody || { error: 'invalid_transition', message: '当前状态不允许该操作' }
          ),
        });
        return;
      }
      const target = this.orders.find((o) => o.id === id);
      if (target) target.status = body.status || target.status;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target || { id, status: body.status }),
      });
    });

    // GET /api/admin/orders（后注册，优先级高于上面的通配）
    await page.route('**/api/admin/orders', async (route) => {
      const req = route.request();
      if (req.method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.orders),
      });
    });
  }

  /** 订单卡片内展示"订单号: {id}"，可按 id 定位 */
  cardById(id: string): Locator {
    return this.orderCards.filter({ hasText: id }).first();
  }

  async clickStatusTab(label: string): Promise<void> {
    const tab = this.page.locator('[class*="tabItem"]').filter({ hasText: label }).first();
    try {
      await tab.click({ timeout: 8000 });
    } catch {
      await tab.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  /** 卡片状态徽章文案 */
  async cardStatusText(card: Locator): Promise<string> {
    const badge = card.locator('[class*="orderStatus"]').first();
    return (await badge.textContent())?.trim() || '';
  }

  /** 收集所有订单卡片上的操作按钮文本（校验客服操作收窄） */
  async collectActionButtonTexts(): Promise<string[]> {
    const all = this.page
      .locator('[class*="payButton"]:not([class*="payButtonText"]), [class*="refundButton"]:not([class*="refundButtonText"])')
      .filter({ visible: true });
    const count = await all.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = await all.nth(i).textContent();
      if (t) texts.push(t.trim());
    }
    return texts;
  }

  /** Taro H5 showModal 自绘弹层：确认按钮 class 为 taro-model__confirm（确认/退款） */
  async confirmModal(confirmLabel?: string): Promise<void> {
    const dialog = this.page.locator('.taro__modal .taro-modal__content').first();
    await dialog.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    const confirmBtn = this.page.locator('.taro-model__confirm').first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      return;
    }
    await this.page.getByText(confirmLabel || '确定', { exact: true }).first().click();
  }

  async expectModalVisible(): Promise<void> {
    await expect(this.page.locator('.taro__modal .taro-modal__content').first()).toBeVisible();
  }

  async expectToast(pattern: string | RegExp): Promise<void> {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 8000 });
  }
}
