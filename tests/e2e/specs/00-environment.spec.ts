import { test, expect } from '../fixtures/test-base';
import { API_ENDPOINTS } from '../test-data/accounts';

const API_BASE = process.env.API_BASE_URL || 'http://123.207.40.7:3001';
const FRONT_BASE = process.env.E2E_BASE_URL || 'http://localhost:10086';

test.describe('阶段0：环境准备 @smoke', () => {
  test('0.1 启动开发服务器（前端可达）', async ({ page }) => {
    const response = await page.goto(FRONT_BASE);
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/MindPace|心理咨询/i);
  });

  test('0.2 后端 API 可达', async ({ request }) => {
    const response = await request.get(`${API_BASE}${API_ENDPOINTS.counselors}`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data) || Array.isArray(data.data)).toBeTruthy();
  });

  test('0.3 API 代理正常（相对路径请求）', async ({ page, consoleCollector }) => {
    await page.goto(FRONT_BASE);
    await page.waitForLoadState('networkidle');
    const apiLogs = consoleCollector.getApiLogs();
    expect(
      apiLogs.some((log) => log.text.includes('/api/counselors'))
    ).toBeTruthy();
  });

  test('0.4 无严重编译 Warning', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    await page.goto(FRONT_BASE);
    await page.waitForLoadState('networkidle');
    const libpngOnly = warnings.every((w) => w.includes('libpng'));
    expect(libpngOnly, `Unexpected warnings: ${warnings.join(', ')}`).toBeTruthy();
  });
});
