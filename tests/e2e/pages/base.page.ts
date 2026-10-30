import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  protected get root(): Locator {
    return this.page.locator('body');
  }

  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return (await this.page.title()) || '';
  }

  async clickByText(text: string, options: { exact?: boolean; selector?: string } = {}): Promise<void> {
    const selector = options.selector || 'text';
    const locator = options.exact
      ? this.page.locator(selector, { hasText: text }).first()
      : this.page.getByText(text, { exact: true }).first();
    await locator.click();
  }

  async clickRole(text: string): Promise<void> {
    await this.page.getByRole('button', { name: text }).first().click();
  }

  async expectTextVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForReady();
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `tests/reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }
}
