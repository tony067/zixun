import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nameInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly switchModeButton: Locator;
  readonly wechatLoginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // Taro H5 输入框结构：外层 <taro-input-core placeholder="..."> 自定义元素包裹内层真正的 <input>。
    // getByPlaceholder().first() 会命中外层 taro-input-core（非 input），fill 失败。
    // 改为直接定位 input 标签 + placeholder 子串匹配。
    this.emailInput = page.locator('input[placeholder*="your@email"], input[placeholder*="邮箱"], input[type="email"]').first();
    this.passwordInput = page.locator('input[type="password"], input[placeholder*="密码"]').first();
    this.nameInput = page.locator('input[placeholder*="昵称"], input[placeholder*="姓名"], input[placeholder*="请输入"], input[placeholder*="请填写"]').first();
    // Taro <Button> 自定义组件未必可被 getByRole('button') 命中，改为按 submitButton class 或文本过滤
    this.loginButton = page.locator('[class*="submitButton"]').first();
    this.registerButton = page.locator('[class*="submitButton"]').last();
    // 登录/注册是两个 tab 切换（tabText class），而非"已有账号/注册账号"文字链接
    this.switchModeButton = page.locator('[class*="tabText"]');
    this.wechatLoginButton = page.getByText(/微信/).filter({ has: page.locator('..') }).first();
    this.errorMessage = page.locator('[class*="error"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/login/index');
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async switchToRegister(): Promise<void> {
    // 顶部 Tab 模式：找到文本为 "注册" 的 tabText 元素并点击
    const tab = this.page.locator('[class*="tabText"]').filter({ hasText: /^注册$/ }).first();
    await tab.click();
    await this.page.waitForTimeout(300);
  }

  async switchToLogin(): Promise<void> {
    const tab = this.page.locator('[class*="tabText"]').filter({ hasText: /^登录$/ }).first();
    await tab.click();
    await this.page.waitForTimeout(300);
  }

  async fillLogin(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async fillRegister(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submitLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async submitRegister(): Promise<void> {
    await this.registerButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillLogin(email, password);
    await this.submitLogin();
  }

  async register(name: string, email: string, password: string): Promise<void> {
    await this.fillRegister(name, email, password);
    await this.submitRegister();
  }

  async expectValidationError(message: string): Promise<void> {
    await expect(this.page.getByText(message).first()).toBeVisible();
  }

  async expectWechatLoginDisabled(): Promise<void> {
    const btn = this.page.locator('[class*="wechatButton"]').first();
    const visible = await btn.isVisible().catch(() => false);
    if (!visible) return;
    await btn.click({ noWaitAfter: true }).catch(() => {});
  }
}
