import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 咨询师详情页 POM（对齐真实档期展示版）
 * 真实类名来源：src/pages/counselor-detail/index.module.scss
 *  - 姓名：`index-module__name___<hash>`；底部操作栏 actionButton（分享/私信/收藏-已收藏）
 *  - 可预约时间（真实档期，来自 GET /api/counselors/{id}/available-slots）：
 *      timesList > timeDay（按天分组）> timeDayLabel（"周X M/D"）+ timeSlots > timeSlot > timeSlotText（"09:00–09:50"）
 *      空档期：noTimesCard（"暂无可预约时段，可与咨询师协调时间"）
 *      快捷入口：quickBookButton（"立即预约"）
 *  - 底部栏：bookButton（"预约咨询"/"已约满"）
 */
export class CounselorDetailPage extends BasePage {
  readonly counselorName: Locator;
  readonly favoriteButton: Locator;
  readonly bookButton: Locator;
  readonly aboutSection: Locator;
  readonly sessionSettingsSection: Locator;
  readonly availableTimeSection: Locator;
  readonly pricingOptions: Locator;
  readonly backButton: Locator;
  // 真实档期
  readonly timeDays: Locator;
  readonly timeDayLabels: Locator;
  readonly timeSlotTexts: Locator;
  readonly noTimesCard: Locator;
  readonly quickBookButton: Locator;

  constructor(page: Page) {
    super(page);
    // 真实 detail 页名字 class 为 `index-module__name___<hash>`（如 sIpo5），不含 counselorName
    this.counselorName = page.locator('[class*="__name"]').first();
    // 底部操作栏第三个 actionButton，文案随收藏状态切换：收藏 ⇄ 已收藏
    this.favoriteButton = page
      .locator('[class*="actionButton"]')
      .filter({ hasText: /已?收藏/ })
      .first();
    // 详情页可能有多个 bookButton（顶部 disabled "已约满" 和底部可点击 "预约咨询"）。
    // 排除 disabled 状态的，避免点击无效导致不跳转
    this.bookButton = page
      .locator('[class*="bookButton"]')
      .filter({ hasText: '预约咨询' })
      .filter({ hasNot: page.locator('[class*="Disabled"], [class*="disabled"]') })
      .last();
    this.aboutSection = page.getByText('关于我').first();
    this.sessionSettingsSection = page.getByText('咨询设置').first();
    this.availableTimeSection = page.getByText(/可预约时间|时段|日期/, { exact: false }).first();
    // 真实详情页价格行 class 为 `index-module__priceRow___<hash>`
    this.pricingOptions = page.locator('[class*="priceRow"]');
    // 详情页返回按钮可能在 taro-navigation-bar-back 容器中
    this.backButton = page.locator('[class*="backButton"], .taro-navigation-bar-back').first();
    // 真实档期：timeDay 后缀匹配避免命中 timeDayLabel/timeSlots
    this.timeDays = page.locator('[class*="timeDay___"]');
    this.timeDayLabels = page.locator('[class*="timeDayLabel"]');
    this.timeSlotTexts = page.locator('[class*="timeSlotText"]');
    this.noTimesCard = page.locator('[class*="noTimesCard"]').first();
    this.quickBookButton = page.locator('[class*="quickBookButton"]').first();
  }

  async open(counselorId: string): Promise<void> {
    await this.goto(`/#/pages/counselor-detail/index?id=${counselorId}`);
    await this.counselorName.waitFor({ state: 'visible', timeout: 15000 });
  }

  async clickFavorite(): Promise<void> {
    await this.favoriteButton.click();
  }

  async clickBook(): Promise<void> {
    await this.bookButton.click();
  }

  /** 当前收藏按钮文案（收藏 / 已收藏） */
  async getFavoriteText(): Promise<string> {
    return ((await this.favoriteButton.textContent()) || '').trim();
  }

  async expectFavorited(): Promise<void> {
    await expect(this.favoriteButton).toHaveText(/已收藏/);
  }

  async expectNotFavorited(): Promise<void> {
    await expect(this.favoriteButton).toHaveText(/^(收藏|未收藏)$/);
  }

  async expectSectionsVisible(): Promise<void> {
    await expect(this.aboutSection).toBeVisible();
    await expect(this.sessionSettingsSection).toBeVisible();
  }

  /** 可预约时间区：是否显示空档期提示 */
  async expectNoSlots(): Promise<void> {
    await expect(this.noTimesCard).toBeVisible();
    await expect(this.noTimesCard).toHaveText(/暂无可预约时段/);
  }

  /** 读取所有日期分组标题（"周X M/D"） */
  async getDayLabels(): Promise<string[]> {
    const labels: string[] = [];
    const count = await this.timeDayLabels.count();
    for (let i = 0; i < count; i++) {
      labels.push(((await this.timeDayLabels.nth(i).textContent()) || '').trim());
    }
    return labels;
  }

  /** 读取所有时段文案（"09:00–09:50"） */
  async getSlotTexts(): Promise<string[]> {
    const texts: string[] = [];
    const count = await this.timeSlotTexts.count();
    for (let i = 0; i < count; i++) {
      texts.push(((await this.timeSlotTexts.nth(i).textContent()) || '').trim());
    }
    return texts;
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }
}
