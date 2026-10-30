import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/** 与 src/types/booking.ts STATUS_META 对齐的三端统一状态文案 */
export const UNIFIED_STATUS_LABELS = [
  '待确认', '待支付', '待咨询', '进行中', '已完成', '已取消', '已拒绝', '已退款',
];

export interface MockBooking {
  id: string;
  counselorId?: string;
  counselor: { id: string; name: string; avatarUrl: string | null; title: string };
  scheduledAt: string;
  durationMinutes?: number;
  sessionMode?: string;
  priceAmount?: number;
  status: string;
  clientNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusPatchCall {
  id: string;
  status: string;
}

/**
 * 咨询师预约管理页（/pages/counselor-bookings/index）POM
 * GET /api/bookings/my 拉取订单；PATCH /api/bookings/{id} 变更状态
 */
export class CounselorBookingsPage extends BasePage {
  readonly title: Locator;
  readonly bookingCards: Locator;
  readonly statusBadges: Locator;
  readonly unauthorizedTip: Locator;
  readonly emptyTip: Locator;
  readonly loadingTip: Locator;
  readonly tabbar: Locator;

  /** PATCH 请求捕获（id + payload.status） */
  readonly patchCalls: StatusPatchCall[] = [];

  private bookings: MockBooking[] = [];

  constructor(page: Page) {
    super(page);
    this.title = page.locator('[class*="header"]').filter({ hasText: '预约管理' }).first();
    // 订单卡片：index-module__bookingCard___<hash>；Taro H5 页面栈保留 stale 隐藏页面，只统计可见实例
    this.bookingCards = page.locator('[class*="bookingCard"]').filter({ visible: true });
    // 状态徽章：index-module__bookingStatus___<hash>（文案/配色来自 getBookingStatusMeta）
    this.statusBadges = page.locator('[class*="bookingStatus"]');
    this.unauthorizedTip = page
      .getByText('请切换到咨询师角色', { exact: false })
      .filter({ visible: true })
      .first();
    this.emptyTip = page.getByText('暂无预约', { exact: true }).first();
    this.loadingTip = page.getByText('加载中...', { exact: true }).first();
    this.tabbar = page.locator('[class*="tabbar"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/counselor-bookings/index');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 拦截订单接口，用可变 mock 数据保证可重复：
   * - GET /api/bookings/my 返回当前 state（PATCH 成功后会同步更新，模拟列表刷新）
   * - PATCH /api/bookings/{id} 记录 payload.status 并按 options 决定成功/失败
   */
  async mockBookings(
    initial: MockBooking[],
    options: { patchStatus?: number; patchBody?: Record<string, unknown> } = {}
  ): Promise<void> {
    this.bookings = initial.map((b) => ({ ...b, counselor: { ...b.counselor } }));
    this.patchCalls.length = 0;
    const page = this.page;

    // PATCH /api/bookings/{id}
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
      const target = this.bookings.find((b) => b.id === id);
      if (target) target.status = body.status || target.status;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target || { id, status: body.status }),
      });
    });

    // GET /api/bookings/my（后注册，优先级高于上面的通配）
    await page.route('**/api/bookings/my', async (route) => {
      const req = route.request();
      if (req.method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.bookings),
      });
    });
  }

  /** 按卡片内展示的姓名（mock 中 counselor.name）定位订单卡片 */
  cardByName(name: string): Locator {
    return this.bookingCards.filter({ hasText: name }).first();
  }

  /** 卡片内的操作按钮（确认预约 / 拒绝并退款 / 退款） */
  actionInCard(card: Locator, label: string): Locator {
    return card.locator('[class*="actionButton"], [class*="refundButton"]').filter({ hasText: label }).first();
  }

  async clickCardAction(cardName: string, label: string): Promise<void> {
    const btn = this.actionInCard(this.cardByName(cardName), label);
    try {
      await btn.click({ timeout: 8000 });
    } catch {
      await btn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  /** 卡片状态徽章文案 */
  async cardStatusText(card: Locator): Promise<string> {
    const badge = card.locator('[class*="bookingStatus"]').first();
    return (await badge.textContent())?.trim() || '';
  }

  /**
   * Taro H5 showModal 自绘弹层：确认按钮 class 为 taro-model__confirm（注意是 model 不是 modal）
   * 文档结构见 @tarojs/taro-h5 dist/api/ui/interaction/modal.js
   */
  async confirmModal(confirmLabel?: string): Promise<void> {
    const dialog = this.page.locator('.taro__modal .taro-modal__content').first();
    await dialog.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    const confirmBtn = this.page.locator('.taro-model__confirm').first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      return;
    }
    // 兜底：按确认按钮文本点击
    const label = confirmLabel || '确定';
    await this.page.getByText(label, { exact: true }).first().click();
  }

  async cancelModal(): Promise<void> {
    const cancelBtn = this.page.locator('.taro-model__cancel').first();
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
      return;
    }
    await this.page.getByText(/取消|再想想/).first().click();
  }

  async expectModalVisible(): Promise<void> {
    await expect(this.page.locator('.taro__modal .taro-modal__content').first()).toBeVisible();
  }

  /** Taro showToast 文本断言（root: .taro__toast） */
  async expectToast(pattern: string | RegExp): Promise<void> {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 8000 });
  }
}
