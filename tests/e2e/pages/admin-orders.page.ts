import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/** GET /api/admin/orders 返回的订单结构（admin-orders 页 normalize 前的原始形态） */
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

/**
 * 管理员订单管理页（/pages/admin-orders/index）POM
 * GET /api/admin/orders 拉取订单；管理员对任意非 refunded/cancelled 订单可退款（PATCH → refunded）
 */
export class AdminOrdersPage extends BasePage {
  readonly title: Locator;
  readonly orderCards: Locator;
  readonly statusBadges: Locator;
  readonly refundButtons: Locator;
  readonly unauthorizedTip: Locator;
  readonly emptyTip: Locator;
  readonly tabbar: Locator;

  /** PATCH 请求捕获（id + payload.status） */
  readonly patchCalls: StatusPatchCall[] = [];

  private orders: MockAdminOrder[] = [];

  constructor(page: Page) {
    super(page);
    this.title = page.locator('[class*="header"]').filter({ hasText: '订单管理' }).first();
    this.orderCards = page.locator('[class*="orderCard"]');
    // 状态徽章：index-module__orderStatus___<hash>（文案/配色来自 getBookingStatusMeta）
    this.statusBadges = page.locator('[class*="orderStatus"]');
    this.refundButtons = page.locator('[class*="refundButton"]');
    this.unauthorizedTip = page.getByText('请切换到管理员角色', { exact: false }).first();
    this.emptyTip = page.getByText(/暂无订单|加载中…/).first();
    this.tabbar = page.locator('[class*="tabbar"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/admin-orders/index');
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

  /** 注册一条更高优先级的 PATCH 冲突响应（模拟服务端 409 非法流转），用于验证中文 toast */
  async mockPatchConflict(statusCode: number, body: Record<string, unknown>): Promise<void> {
    await this.page.route('**/api/bookings/**', async (route) => {
      const req = route.request();
      if (req.method() !== 'PATCH') return route.fallback();
      await route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify(body),
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

  /** Taro H5 showModal 自绘弹层：确认按钮 class 为 taro-model__confirm（本页 confirmText=退款） */
  async confirmModal(confirmLabel = '退款'): Promise<void> {
    const dialog = this.page.locator('.taro__modal .taro-modal__content').first();
    await dialog.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    const confirmBtn = this.page.locator('.taro-model__confirm').first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      return;
    }
    await this.page.getByText(confirmLabel, { exact: true }).first().click();
  }

  async expectModalVisible(): Promise<void> {
    await expect(this.page.locator('.taro__modal .taro-modal__content').first()).toBeVisible();
  }

  async expectToast(pattern: string | RegExp): Promise<void> {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 8000 });
  }
}
