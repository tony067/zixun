import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type Role = 'client' | 'counselor' | 'admin' | 'support';

/**
 * 注意：Taro H5 页面栈会保留历史页面的 DOM（隐藏的 stale 实例），
 * 每个页面各自渲染一份 CustomTabBar。所有定位器必须只匹配"可见"实例，
 * 否则 .first() 会命中最早挂载的 stale 隐藏实例导致点击/断言失效。
 */
export class RoleSwitcherPage extends BasePage {
  readonly roleSwitchButton: Locator;
  readonly rolePickerModal: Locator;
  readonly roleItems: Locator;
  readonly cancelButton: Locator;
  readonly modalMask: Locator;

  constructor(page: Page) {
    super(page);
    // roleSwitch 容器含 roleSwitchText 子元素；用 filter 精确匹配外层容器，且仅取可见实例
    this.roleSwitchButton = page
      .locator('[class*="roleSwitch"]')
      .filter({ has: page.locator('[class*="roleSwitchText"]') })
      .filter({ visible: true })
      .first();
    // rolePicker 弹窗容器含 roleItem 子元素；用 filter 排除 rolePickerCancel 等子元素，仅取可见实例
    this.rolePickerModal = page
      .locator('[class*="rolePicker"]')
      .filter({ has: page.locator('[class*="roleItem"]') })
      .filter({ visible: true })
      .first();
    // 角色项中真实包含 roleItemLabel/roleItemInfo，用 roleItem 能命中
    this.roleItems = page.locator('[class*="roleItem"]').filter({ has: page.locator('[class*="roleItemLabel"]') });
    // 底部"取消"按钮 class 为 rolePickerCancel，文本"取消"；仅取可见实例（stale 页面会有同名隐藏按钮）
    this.cancelButton = page
      .locator('[class*="rolePickerCancel"]')
      .filter({ hasText: '取消' })
      .filter({ visible: true })
      .first();
    // 全屏蒙层 z-index 1000，切换面板（bottom sheet）z-index 1001 会盖住蒙层中部，
    // 点击时需指定面板外的位置（左上角）避免 pointer interception
    this.modalMask = page
      .locator('[class*="modalMask"]')
      .filter({ visible: true })
      .first();
  }

  async openPicker(): Promise<void> {
    // 切换按钮可能被 TabBar 层叠遮挡，先尝试普通点击，失败后用 force/evaluate 兜底；
    // switchTab 到当前页会异步重挂载页面并把刚打开的弹层复位，因此打开后需确认弹层稳定，
    // 不稳定则重试（最多 3 次）
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.roleSwitchButton.click({ timeout: 8000 });
      } catch {
        await this.roleSwitchButton.click({ force: true, timeout: 5000 }).catch(() => {});
        await this.roleSwitchButton.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
      }
      const opened = await this.rolePickerModal
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      if (!opened) continue;
      await this.page.waitForTimeout(500);
      if (await this.rolePickerModal.isVisible().catch(() => false)) return;
    }
    await this.rolePickerModal.waitFor({ state: 'visible', timeout: 10000 });
  }

  async closePicker(): Promise<void> {
    await this.cancelButton.click();
    await this.rolePickerModal.waitFor({ state: 'hidden' });
  }

  async closePickerByMask(): Promise<void> {
    // 蒙层中部被底部切换面板覆盖，点击左上角空白区域触发蒙层 onClick 关闭
    await this.modalMask.click({ position: { x: 24, y: 24 } });
    await this.rolePickerModal.waitFor({ state: 'hidden' });
  }

  async selectRole(role: Role): Promise<void> {
    const roleLabels: Record<Role, string> = {
      client: '来访者',
      counselor: '咨询师',
      admin: '管理员',
      support: '客服',
    };
    // 直接点击角色项的 label 文本（事件冒泡触发 roleItem 容器 onClick）。
    // 不能对 [class*="roleItem"] 容器做 hasText 过滤：弹层内容区（祖先容器）同样包含
    // 匹配文本且 DOM 序在前，first() 会点中错误角色（曾导致切 counselor 实际点了来访者）。
    const label = this.rolePickerModal
      .locator('[class*="roleItemLabel"]')
      .filter({ hasText: roleLabels[role] })
      .first();
    await label.click({ timeout: 10000 }).catch(() => {});
    // 弹层关闭证明 roleItem onClick 已触发（handleRoleSwitch 第一行即关弹层，随后 setRole 生效）
    await this.rolePickerModal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async switchToRole(role: Role): Promise<void> {
    await this.openPicker();
    await this.selectRole(role);
  }

  async getVisibleRoles(): Promise<string[]> {
    const count = await this.roleItems.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.roleItems.nth(i).textContent();
      if (text) labels.push(text.trim());
    }
    return labels;
  }

  async expectRoleVisible(role: Role): Promise<void> {
    const labels: Record<Role, string> = {
      client: '来访者',
      counselor: '咨询师',
      admin: '管理员',
      support: '客服',
    };
    // 限定在 rolePicker 内查找
    await expect(
      this.rolePickerModal
        .locator('[class*="roleItemLabel"], [class*="roleItem"]')
        .filter({ hasText: labels[role] })
        .first()
    ).toBeVisible();
  }

  async expectRoleHidden(role: Role): Promise<void> {
    const labels: Record<Role, string> = {
      client: '来访者',
      counselor: '咨询师',
      admin: '管理员',
      support: '客服',
    };
    // 限定在 rolePicker 内查找
    await expect(
      this.rolePickerModal
        .locator('[class*="roleItemLabel"], [class*="roleItem"]')
        .filter({ hasText: labels[role] })
    ).toHaveCount(0);
  }
}
