import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 我的页 POM（对齐 2025 全新改版）
 * 真实类名来源：src/pages/profile/index.module.scss
 *  - 头部：avatarWrapper + cameraBadge（相机角标）/ userName（主标题=邮箱）/ editButton / userDesc
 *  - 我的预约卡片：bookingCard + bookingCountBadge（绿色数量角标）+ bookingAllText（"全部预约"）
 *    + bookingItem + upcomingPill（"即将咨询"）+ bookingEmpty（"暂无预约"）
 *  - 2×2 宫格：gridSection > gridCard（我的收藏/新手必读/联系客服/更多设置）
 *  - 底部：logoutCard（红色"退出登录"）/ bottomBar + loginButton（未登录"微信一键登录"）
 */
export class ProfilePage extends BasePage {
  readonly logoutButton: Locator;
  readonly myBookingsEntry: Locator;
  readonly myFavoritesEntry: Locator;
  readonly settingsEntry: Locator;
  readonly loginButton: Locator;
  // 头部
  readonly avatarWrapper: Locator;
  readonly cameraBadge: Locator;
  readonly userName: Locator;
  readonly userDesc: Locator;
  readonly editButton: Locator;
  // 我的预约卡片
  readonly bookingCard: Locator;
  readonly bookingTitle: Locator;
  readonly bookingCountBadge: Locator;
  readonly bookingAllText: Locator;
  readonly bookingHeader: Locator;
  readonly bookingItem: Locator;
  readonly bookingName: Locator;
  readonly bookingTime: Locator;
  readonly upcomingPill: Locator;
  readonly bookingEmpty: Locator;
  // 宫格
  readonly gridCards: Locator;

  constructor(page: Page) {
    super(page);
    this.logoutButton = page.locator('[class*="logoutCard"]').first();
    this.myBookingsEntry = page.getByText('我的预约', { exact: true }).first();
    this.myFavoritesEntry = page.getByText('我的收藏', { exact: true }).first();
    this.settingsEntry = page.getByText('更多设置', { exact: true }).first();
    // Taro H5 hash 路由会把栈内前一页面保留在 DOM（隐藏）：首页顶栏也有同名 loginButton
    // class（"登录"入口），必须限定可见元素，否则 first() 命中隐藏的首页按钮
    this.loginButton = page.locator('[class*="loginButton"]:visible').first();
    // 头部：主标题用 userName___ 后缀匹配，避免命中外层 userNameRow
    this.userName = page.locator('[class*="userName___"]').first();
    this.userDesc = page.locator('[class*="userDesc"]').first();
    this.avatarWrapper = page.locator('[class*="avatarWrapper"]').first();
    this.cameraBadge = page.locator('[class*="cameraBadge"]').first();
    this.editButton = page.locator('[class*="editButton"]').first();
    // 我的预约卡片
    this.bookingCard = page.locator('[class*="bookingCard"]').first();
    this.bookingTitle = page.getByText('我的预约', { exact: true }).first();
    this.bookingCountBadge = page.locator('[class*="bookingCountBadge"]').first();
    this.bookingAllText = page.locator('[class*="bookingAllText"]').first();
    this.bookingHeader = page.locator('[class*="bookingHeader"]').first();
    this.bookingItem = page.locator('[class*="bookingItem"]').first();
    this.bookingName = page.locator('[class*="bookingName"]').first();
    this.bookingTime = page.locator('[class*="bookingTime"]').first();
    this.upcomingPill = page.locator('[class*="upcomingPill"]').first();
    this.bookingEmpty = page.locator('[class*="bookingEmpty"]').first();
    // 宫格（2×2）
    this.gridCards = page.locator('[class*="gridCard"]');
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/profile/index');
    await this.page.waitForLoadState('networkidle');
  }

  /** 点击头像相机角标（触发"资料编辑即将上线" toast） */
  async clickCameraBadge(): Promise<void> {
    await this.cameraBadge.click();
  }

  /** 点击"全部预约 >"（整个卡片头部可点） */
  async clickMyBookings(): Promise<void> {
    await this.bookingHeader.click();
  }

  /** 点击"即将咨询"条目（跳咨询师详情） */
  async clickUpcomingBooking(): Promise<void> {
    await this.bookingItem.click();
  }

  /** 点击宫格入口：我的收藏 / 新手必读 / 联系客服 / 更多设置 */
  async clickGridItem(title: string): Promise<void> {
    await this.gridCards.filter({ hasText: title }).first().click();
  }

  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  /** Taro showModal 自绘弹层确认（默认确认按钮文案"确定"） */
  async confirmDialog(text: string = '确定'): Promise<void> {
    await this.page.getByText(text, { exact: true }).last().click();
  }

  /** Taro showModal 自绘弹层取消 */
  async cancelDialog(text: string = '取消'): Promise<void> {
    await this.page.getByText(text, { exact: true }).last().click();
  }

  /** 未登录底栏"微信一键登录" */
  async clickWechatLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async clickMyFavorites(): Promise<void> {
    await this.clickGridItem('我的收藏');
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.logoutButton).toBeVisible();
    await expect(this.cameraBadge).toBeVisible();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
    await expect(this.bookingCard).toHaveCount(0);
    await expect(this.logoutButton).toHaveCount(0);
  }

  /** 预约卡片数量角标文案（无角标时返回 null） */
  async getBookingCountBadgeText(): Promise<string | null> {
    if ((await this.bookingCountBadge.count()) === 0) return null;
    return ((await this.bookingCountBadge.textContent()) || '').trim() || null;
  }
}

/** 供 01 spec 直接使用的未登录态断言辅助 */
export async function expectProfileLoggedOut(page: Page): Promise<void> {
  await expect(page.locator('[class*="loginButton"]').first()).toBeVisible();
  await expect(page.locator('[class*="bookingCard"]')).toHaveCount(0);
  await expect(page.locator('[class*="logoutCard"]')).toHaveCount(0);
}
