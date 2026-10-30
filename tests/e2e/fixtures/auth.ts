import { test as base, expect } from './test-base';
import { ACCOUNTS, API_ENDPOINTS } from '../test-data/accounts';

type AccountKey = keyof typeof ACCOUNTS;

interface AuthFixture {
  loginAs(account: AccountKey): Promise<void>;
  logout(): Promise<void>;
  ensureLoggedOut(): Promise<void>;
}

export const test = base.extend<AuthFixture>({
  loginAs: async ({ page, loginPage }, use) => {
    async function loginAs(account: AccountKey) {
      const accountData = ACCOUNTS[account];
      const apiResponsePromise = page.waitForResponse(
        (resp) => resp.url().includes(API_ENDPOINTS.login) && resp.request().method() === 'POST',
        { timeout: 15000 }
      );
      await loginPage.open();
      await loginPage.login(accountData.email, accountData.password);
      const response = await apiResponsePromise;
      expect(response.ok()).toBeTruthy();
      await page.waitForLoadState('networkidle');
      // 登录成功后登录页会延迟 1.5s 才 navigateBack；等待其完成，
      // 避免它与用例随后的 hash 跳转（如 profilePage.open()）竞态把页面弹回登录页
      await page
        .waitForURL((url) => !url.href.includes('pages/login/index'), { timeout: 8000 })
        .catch(() => {});
    }
    await use(loginAs);
  },
  logout: async ({ page }, use) => {
    async function logout() {
      await page.evaluate(() => {
        try {
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('mindpace_user');
        } catch (e) {
          console.error('清理登录态失败', e);
        }
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    await use(logout);
  },
  ensureLoggedOut: async ({ page }, use) => {
    async function ensureLoggedOut() {
      await page.evaluate(() => {
        try {
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('mindpace_user');
        } catch (e) {
          console.error('清理登录态失败', e);
        }
      });
    }
    await use(ensureLoggedOut);
  },
});

export { expect };
