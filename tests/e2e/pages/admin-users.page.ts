import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/** GET /api/admin/users 返回的用户结构（admin-users 页 normalize 前的原始形态） */
export interface MockAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface UserPatchCall {
  id: string;
  role: string;
}

/**
 * 管理员用户管理页（/pages/admin-users/index）POM
 * GET /api/admin/users 拉取用户；PATCH /api/admin/users/{id} body {role} 授予/撤销客服
 */
export class AdminUsersPage extends BasePage {
  readonly title: Locator;
  readonly userCards: Locator;
  readonly roleBadges: Locator;
  readonly unauthorizedTip: Locator;
  readonly emptyTip: Locator;
  readonly tabbar: Locator;

  /** PATCH 请求捕获（id + payload.role） */
  readonly patchCalls: UserPatchCall[] = [];

  private users: MockAdminUser[] = [];

  constructor(page: Page) {
    super(page);
    this.title = page.locator('[class*="header"]').filter({ hasText: '用户管理' }).first();
    // Taro H5 页面栈保留 stale 隐藏页面，只统计可见实例，避免 userCardBy 命中隐藏旧卡片
    this.userCards = page.locator('[class*="userCard"]').filter({ visible: true });
    // 角色徽章：index-module__userRole___<hash>（来访者/测试/咨询师/管理员/客服）
    this.roleBadges = page.locator('[class*="userRole"]');
    this.unauthorizedTip = page
      .getByText('请切换到管理员角色', { exact: false })
      .filter({ visible: true })
      .first();
    this.emptyTip = page.getByText(/暂无用户|加载中…/).first();
    this.tabbar = page.locator('[class*="tabbar"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/admin-users/index');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 拦截用户接口，用可变 mock 数据保证可重复：
   * - GET /api/admin/users 返回当前 state（PATCH 成功后同步更新，模拟列表刷新）
   * - PATCH /api/admin/users/{id} 记录 payload.role 并按 options 决定成功/失败
   */
  async mockUsers(
    initial: MockAdminUser[],
    options: { patchStatus?: number; patchBody?: Record<string, unknown> } = {}
  ): Promise<void> {
    this.users = initial.map((u) => ({ ...u }));
    this.patchCalls.length = 0;
    const page = this.page;

    // PATCH /api/admin/users/{id}
    await page.route('**/api/admin/users/**', async (route) => {
      const req = route.request();
      if (req.method() !== 'PATCH') return route.fallback();
      const id = (req.url().match(/\/api\/admin\/users\/([^/?#]+)/) || [])[1] || '';
      const body = (req.postDataJSON() || {}) as { role?: string };
      this.patchCalls.push({ id, role: body.role || '' });
      if (options.patchStatus && options.patchStatus !== 200) {
        await route.fulfill({
          status: options.patchStatus,
          contentType: 'application/json',
          body: JSON.stringify(options.patchBody || { error: 'forbidden', message: '无权操作该用户' }),
        });
        return;
      }
      const target = this.users.find((u) => u.id === id);
      if (target) target.role = body.role || target.role;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target || { id, role: body.role }),
      });
    });

    // GET /api/admin/users（列表）
    await page.route('**/api/admin/users', async (route) => {
      const req = route.request();
      if (req.method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.users),
      });
    });
  }

  /** 按邮箱或昵称定位用户卡片 */
  userCardBy(keyword: string): Locator {
    return this.userCards.filter({ hasText: keyword }).first();
  }

  /** "设为客服" / "移回来访" 按钮（index-module__actionButton___<hash>） */
  actionButtonInCard(card: Locator, label: string): Locator {
    return card.locator('[class*="actionButton"]').filter({ hasText: label }).first();
  }

  async clickCardAction(cardKeyword: string, label: string): Promise<void> {
    const btn = this.actionButtonInCard(this.userCardBy(cardKeyword), label);
    try {
      await btn.click({ timeout: 8000 });
    } catch {
      await btn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  /** 卡片角色徽章文案 */
  async cardRoleText(card: Locator): Promise<string> {
    const badge = card.locator('[class*="userRole"]').first();
    return (await badge.textContent())?.trim() || '';
  }

  /** 切换"全部/来访者/咨询师"状态 tab（页面级 tabBar 内 tabItem，按文本区分自定义 TabBar） */
  async clickStatusTab(label: string): Promise<void> {
    const tab = this.page.locator('[class*="tabItem"]').filter({ hasText: label }).first();
    try {
      await tab.click({ timeout: 8000 });
    } catch {
      await tab.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  /** Taro H5 showModal 自绘弹层：确认按钮 class 为 taro-model__confirm（本页 confirmText=确认） */
  async confirmModal(): Promise<void> {
    const dialog = this.page.locator('.taro__modal .taro-modal__content').first();
    await dialog.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    const confirmBtn = this.page.locator('.taro-model__confirm').first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      return;
    }
    await this.page.getByText('确认', { exact: true }).first().click();
  }

  async expectModalVisible(): Promise<void> {
    await expect(this.page.locator('.taro__modal .taro-modal__content').first()).toBeVisible();
  }

  async expectToast(pattern: string | RegExp): Promise<void> {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 8000 });
  }
}
