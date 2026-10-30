import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:10086';
const startDevServer = process.env.START_DEV_SERVER === '1';
// 沙箱环境：系统级 socket 异常时，可通过 `E2E_CONNECT_OVER_CDP=http://<host>:<port>` 连接外部已启动的浏览器（如 browser_use 打开的页面）绕过限制
const connectOverCDP = process.env.E2E_CONNECT_OVER_CDP;
const useSandboxArgs = process.env.PLAYWRIGHT_SANDBOX !== '0';
const disableVideoAndTrace = !!process.env.E2E_MINIMAL_ARTIFACTS;

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'tests/reports/html', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'tests/reports/results.json' }],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: disableVideoAndTrace ? 'off' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: disableVideoAndTrace ? 'off' : 'retain-on-failure',
    viewport: { width: 390, height: 844 },
    locale: 'zh-CN',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    // launch 保守参数：降低对系统目录 / GPU / 扩展的触达，避免沙箱受限
    launchOptions: connectOverCDP
      ? undefined
      : {
          headless: !process.env.PLAYWRIGHT_HEADED,
          args: useSandboxArgs
            ? [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-sync',
                '--hide-scrollbars',
                '--mute-audio',
              ]
            : [],
        },
    // 通过 connectOverCDP 连接外部浏览器（例如沙箱外已启动的 Chrome），绕过本进程 socket 故障
    connectOptions: connectOverCDP
      ? { wsEndpoint: connectOverCDP.startsWith('ws') ? connectOverCDP : undefined, endpointURL: connectOverCDP.startsWith('http') ? connectOverCDP : undefined }
      : undefined,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: connectOverCDP ? {} : { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: startDevServer
    ? {
        command: 'npm run dev:h5',
        url: BASE_URL,
        timeout: 180_000,
        reuseExistingServer: true,
      }
    : undefined,
});
