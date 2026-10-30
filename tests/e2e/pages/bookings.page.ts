import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 我的预约列表 POM（对齐状态新规范 + 取消预约）
 * 真实类名来源：src/pages/bookings/index.module.scss + src/components/BookingCard/index.module.scss
 *  - 头部：backButton + title（"我的预约"）
 *  - 状态 tab：tabs > tab/tabActive > tabText（全部/待确认/待咨询/已完成）
 *  - 订单卡片：BookingCard 根节点 `index-module__card___<hash>`；statusTag（状态徽章，新规范文案/配色）
 *  - 取消：cancelButton（仅 待确认/待支付/待咨询 可见）→ Taro showModal（"再想想"/"取消预约"）→ PATCH /api/bookings/{id}
 *  - 空态：emptyText（"暂无...预约"）
 */
export class BookingsPage extends BasePage {
  readonly bookingCards: Locator;
  readonly statusTabs: Locator;
  readonly backButton: Locator;
  readonly tabbar: Locator;
  readonly statusTags: Locator;
  readonly cancelButtons: Locator;
  readonly emptyText: Locator;
  readonly page_title: Locator;

  constructor(page: Page) {
    super(page);
    // 真实预约卡片 class 为 `index-module__card___<hash>`（如 C5C7k），与首页同属 `__card` 族
    this.bookingCards = page.locator('[class*="__card"]');
    this.statusTabs = page.locator('[class*="tabs"] [class*="tabText"]');
    this.backButton = page.locator('[class*="backButton"]').first();
    this.tabbar = page.locator('[class*="tabbar"], [class*="tabBar"]').first();
    this.statusTags = page.locator('[class*="statusTag"]');
    // 取消行按钮：排除 cancelButtonText（[class*="cancelButton"] 会子串误匹配内层 Text）
    this.cancelButtons = page.locator('[class*="cancelButton"]:not([class*="cancelButtonText"])');
    this.emptyText = page.locator('[class*="emptyText"]').first();
    this.page_title = page.locator('[class*="title"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/bookings/index');
    // 实现说明：Taro hash 路由的页面层切换是异步的，networkidle 可能早于目标页
    // 渲染完成（此时 DOM 中仍是登录页层，[class*="__card"] 只命中登录卡片）。
    // 这里显式等待页面 tabs 渲染（tabs 与数据无关、随页面一次性渲染），再执行查询。
    await this.statusTabs.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  async getBookingsCount(): Promise<number> {
    return await this.bookingCards.count();
  }

  async clickStatusTab(label: string): Promise<void> {
    await this.page.getByText(label, { exact: true }).first().click();
  }

  async filterByStatus(status: 'all' | 'confirmed' | 'pending_confirmation' | 'completed'): Promise<void> {
    const labelMap = {
      all: '全部',
      confirmed: '待咨询',
      pending_confirmation: '待确认',
      completed: '已完成',
    };
    await this.clickStatusTab(labelMap[status]);
  }

  /** 所有订单的状态徽章文案 */
  async getStatusTexts(): Promise<string[]> {
    const texts: string[] = [];
    const count = await this.statusTags.count();
    for (let i = 0; i < count; i++) {
      texts.push(((await this.statusTags.nth(i).textContent()) || '').trim());
    }
    return texts;
  }

  /**
   * 取消第一条可取消订单：
   * 1) 点击"取消预约"行按钮 → Taro showModal（确认按钮文案"取消预约"，取消按钮"再想想"）
   * 2) confirm=true 点确认（弹层最后渲染于 body 末尾），confirm=false 点"再想想"
   */
  async cancelFirstBooking(confirm: boolean = true): Promise<void> {
    await this.cancelButtons.first().click();
    if (confirm) {
      await this.page.getByText('取消预约', { exact: true }).last().click();
    } else {
      await this.page.getByText('再想想', { exact: true }).last().click();
    }
  }

  async expectBackButtonVisible(): Promise<void> {
    await expect(this.backButton).toBeVisible();
  }

  async expectTabbarVisible(): Promise<void> {
    await expect(this.tabbar).toBeVisible();
  }
}

/**
 * 构造 GET /api/bookings/my 订单 mock（normalizeBooking 可解析）
 * 状态规范：待确认/待支付/待咨询/进行中/已完成/已取消/已拒绝/已退款
 */
export function buildMockBooking(overrides: Record<string, any> = {}) {
  const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  return {
    id: 'bk-e2e-1',
    counselorId: 'c-e2e-1',
    counselor: { id: 'c-e2e-1', name: '测试咨询师', avatarUrl: null, title: '' },
    scheduledAt: inTwoDays,
    durationMinutes: 50,
    sessionMode: '视频咨询',
    priceAmount: 400,
    status: 'pending_confirmation',
    clientNote: '姓名：自动化测试；手机号：13800000000',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
