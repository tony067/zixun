import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 首页 POM（对齐 2025 改版：地区筛选升级为 省→市 级联）
 * 真实类名来源：src/pages/index/index.module.scss
 *  - chips：filterItem / filterText / filterArrow / filterClear / filterFunnel
 *  - 筛选面板：filterPanel + filterSection + optionItem/optionActive/optionText
 *  - 地区级联：regionBackRow（"‹ 返回省份"）+ regionSelectedText（"已选：XX"）
 *  - 咨询师卡片：CounselorCard 根节点 `index-module__card___<hash>`
 */
export class HomePage extends BasePage {
  readonly loginButton: Locator;
  readonly searchInput: Locator;
  readonly guideButton: Locator;
  readonly bellButton: Locator;
  readonly filterButtons: Locator;
  readonly counselorCards: Locator;
  readonly clearFilterButton: Locator;
  readonly applyFilterButton: Locator;
  readonly filterPanel: Locator;
  readonly guideModal: Locator;
  readonly tabbar: Locator;
  readonly tabbarItems: Locator;
  readonly roleSwitchButton: Locator;
  readonly emptyState: Locator;
  // 地区级联
  readonly regionSection: Locator;
  readonly regionOptions: Locator;
  readonly backToProvinceButton: Locator;
  readonly regionSelectedText: Locator;
  readonly moreProvincesButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.locator('[class*="loginButton"]').first();
    // Taro H5 输入框外层 <taro-input-core> 也带 placeholder，strict mode 会报多元素。
    // 直接定位 input 标签。
    this.searchInput = page.locator('input[placeholder*="搜索名字"]').first();
    this.guideButton = page.getByText('新手必读').first();
    this.bellButton = page.locator('[class*="noticeButton"]').first();
    this.filterButtons = page.locator('[class*="filterItem"]');
    // 真实页面卡片 class 为 `index-module__card___<hash>`（如 XWhb1），不含 counselorCard 字样
    this.counselorCards = page.locator('[class*="__card"]').filter({ hasNot: page.locator('[class*="bannerCard"]') });
    this.clearFilterButton = page.getByText('清除全部').first();
    this.applyFilterButton = page.getByText('应用筛选').first();
    this.filterPanel = page.locator('[class*="filterPanel"]').first();
    this.guideModal = page.locator('[class*="modalContent"]').first();
    // 真实 TabBar 容器 class 为 `taro-tabbar__container`（全小写），不含大写 tabBar
    this.tabbar = page.locator('[class*="tabbar"], [class*="tabBar"]').first();
    this.tabbarItems = page.locator('[class*="tabItem"]');
    this.roleSwitchButton = page.getByText('切换', { exact: true }).first();
    this.emptyState = page.locator('[class*="emptyState"]').first();
    // 地区级联：筛选面板中标题为"地区"的 filterSection（省/市两个视图共用该容器）
    this.regionSection = page
      .locator('[class*="filterPanel"] [class*="filterSection"]')
      .filter({ hasText: '地区' })
      .first();
    this.regionOptions = this.regionSection.locator('[class*="optionItem"]');
    this.backToProvinceButton = this.regionSection.locator('[class*="filterMore"]').filter({ hasText: '返回省份' }).first();
    this.regionSelectedText = page.locator('[class*="regionSelectedText"]').first();
    this.moreProvincesButton = this.regionSection.locator('[class*="filterMore"]').filter({ hasText: '更多' }).first();
  }

  async open(): Promise<void> {
    await this.goto('/');
    await this.counselorCards.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async search(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);
  }

  async openGuide(): Promise<void> {
    await this.guideButton.click();
    await this.guideModal.waitFor({ state: 'visible' });
  }

  async closeGuide(): Promise<void> {
    await this.page.getByText('×').first().click();
    await this.guideModal.waitFor({ state: 'hidden' });
  }

  async openFilter(dimension: 'city' | 'price' | 'direction' | 'all' = 'all'): Promise<void> {
    if (dimension === 'all') {
      await this.page.locator('[class*=filterFunnel]').click();
    } else {
      // 真实文本为 "地区 ›"、"价格 ›"、"咨询方向 ›"，带后缀符号；
      // 用 filterText 子元素定位避免命中整个 filterBar
      const labels = { city: '地区', price: '价格', direction: '咨询方向' };
      const target = this.page
        .locator('[class*="filterText"]')
        .filter({ hasText: labels[dimension] })
        .first();
      // 元素可能被 searchInput 遮挡，用 force 或 evaluate 兜底
      try {
        await target.click({ timeout: 5000 });
      } catch {
        await target.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
      }
    }
    await this.filterPanel.waitFor({ state: 'visible' }).catch(() => {});
  }

  /** 读取筛选栏第 index 个 chip 的文案（0=地区 1=价格 2=咨询方向） */
  async getChipText(index: number): Promise<string> {
    const chip = this.filterButtons.nth(index).locator('[class*="filterText"]');
    return ((await chip.textContent()) || '').trim();
  }

  /** 打开地区筛选并返回省级视图（供链式使用） */
  async openRegionPanel(): Promise<void> {
    await this.openFilter('city');
    await this.filterPanel.waitFor({ state: 'visible' }).catch(() => {});
  }

  /** 省级视图：点击某省份 pill（首项为"全国/线上"；面板默认仅展示前 8 省，需先点"更多"展开） */
  async selectProvince(province: string): Promise<void> {
    const target = this.regionOptions.filter({ hasText: province }).first();
    const visible = (await target.count()) > 0 && (await target.isVisible().catch(() => false));
    if (!visible) {
      await this.moreProvincesButton.click().catch(() => {});
    }
    await target.click();
  }

  /** 市级视图：点击某城市 pill，选中后面板自动收起 */
  async selectCity(city: string): Promise<void> {
    await this.regionOptions.filter({ hasText: city }).first().click();
    await this.filterPanel.waitFor({ state: 'hidden' }).catch(() => {});
  }

  /** 市级视图：点击"‹ 返回省份" */
  async backToProvinces(): Promise<void> {
    await this.backToProvinceButton.click();
  }

  async isFilterPanelVisible(): Promise<boolean> {
    return await this.filterPanel.isVisible().catch(() => false);
  }

  /** 费用筛选：选中即收起 */
  async selectPriceOption(option: string): Promise<void> {
    await this.openFilter('price');
    const section = page_feeSection(this.page);
    await section.locator('[class*="optionItem"]').filter({ hasText: option }).first().click();
    await this.filterPanel.waitFor({ state: 'hidden' }).catch(() => {});
  }

  /** 咨询方向筛选（多选）：选中即收起，chip 显示 方向(n) */
  async selectDirectionOption(option: string): Promise<void> {
    await this.openFilter('direction');
    const section = this.page
      .locator('[class*="filterPanel"] [class*="filterSection"]')
      .filter({ hasText: '咨询方向' })
      .first();
    await section.locator('[class*="optionItem"]').filter({ hasText: option }).first().click();
    await this.filterPanel.waitFor({ state: 'hidden' }).catch(() => {});
  }

  /** 筛选栏"清除"chip（设置任一筛选后出现），一键清空含省/市 */
  async clickClearChip(): Promise<void> {
    const chip = this.page.locator('[class*="filterClear"]').filter({ hasText: '清除' }).first();
    await chip.click();
  }

  async selectFilterOption(option: string): Promise<void> {
    await this.page.getByText(option, { exact: true }).first().click();
  }

  async applyFilters(): Promise<void> {
    await this.applyFilterButton.click();
    await this.filterPanel.waitFor({ state: 'hidden' });
  }

  async clearFilters(): Promise<void> {
    await this.clearFilterButton.click();
  }

  async clickCounselorCard(index: number = 0): Promise<void> {
    await this.counselorCards.nth(index).click();
  }

  async getTabbarItemsText(): Promise<string[]> {
    const items = this.tabbarItems;
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  async expectTabbarContains(texts: string[]): Promise<void> {
    const actual = await this.getTabbarItemsText();
    for (const text of texts) {
      expect(actual.some(t => t.includes(text))).toBeTruthy();
    }
  }

  async expectRoleSwitchVisible(): Promise<void> {
    await expect(this.roleSwitchButton).toBeVisible();
  }

  async expectRoleSwitchHidden(): Promise<void> {
    await expect(this.roleSwitchButton).toBeHidden();
  }

  async expectGreetingContains(name: string): Promise<void> {
    await expect(this.page.getByText(new RegExp(name)).first()).toBeVisible();
  }
}

/** 费用筛选 section（标题为"费用"） */
function page_feeSection(page: Page): Locator {
  return page
    .locator('[class*="filterPanel"] [class*="filterSection"]')
    .filter({ hasText: '费用' })
    .first();
}
