import { Page, expect } from '@playwright/test';

export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  options: { timeout?: number; method?: string } = {}
): Promise<void> {
  const { timeout = 15000, method } = options;
  await page.waitForResponse(
    (resp) => {
      const urlMatch =
        typeof urlPattern === 'string'
          ? resp.url().includes(urlPattern)
          : urlPattern.test(resp.url());
      const methodMatch = !method || resp.request().method() === method;
      return urlMatch && methodMatch;
    },
    { timeout }
  );
}

export async function waitForLoadingToFinish(page: Page): Promise<void> {
  const loadingLocator = page.getByText('正在加载', { exact: false });
  if (await loadingLocator.isVisible().catch(() => false)) {
    await expect(loadingLocator).toBeHidden({ timeout: 15000 });
  }
  await page.waitForLoadState('networkidle');
}

export async function waitForTabbarReady(page: Page): Promise<void> {
  await page.locator('[class*="tabBar"]').first().waitFor({ state: 'visible', timeout: 10000 });
}

export async function expectElementContainsText(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  const element = page.locator(selector).first();
  await expect(element).toContainText(text);
}

export async function waitAndClick(
  page: Page,
  text: string,
  options: { exact?: boolean; timeout?: number } = {}
): Promise<void> {
  const { exact = true, timeout = 10000 } = options;
  const locator = exact
    ? page.getByText(text, { exact: true }).first()
    : page.getByText(text).first();
  await locator.waitFor({ state: 'visible', timeout });
  await locator.click();
}

export async function retryClickUntilSuccess(
  page: Page,
  text: string,
  maxAttempts: number = 3
): Promise<void> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await waitAndClick(page, text);
      return;
    } catch (err) {
      lastError = err as Error;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}
