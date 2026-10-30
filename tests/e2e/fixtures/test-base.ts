import { test as base, Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { CounselorDetailPage } from '../pages/counselor-detail.page';
import { BookingFlowPage } from '../pages/booking-flow.page';
import { BookingsPage } from '../pages/bookings.page';
import { ProfilePage } from '../pages/profile.page';
import { RoleSwitcherPage } from '../pages/role-switcher.page';
import { ConsoleCollector } from '../utils/console-logger';
import { ApiMonitor } from '../utils/api-monitor';

interface PageFixtures {
  homePage: HomePage;
  loginPage: LoginPage;
  counselorDetailPage: CounselorDetailPage;
  bookingFlowPage: BookingFlowPage;
  bookingsPage: BookingsPage;
  profilePage: ProfilePage;
  roleSwitcherPage: RoleSwitcherPage;
  consoleCollector: ConsoleCollector;
  apiMonitor: ApiMonitor;
}

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  counselorDetailPage: async ({ page }, use) => {
    await use(new CounselorDetailPage(page));
  },
  bookingFlowPage: async ({ page }, use) => {
    await use(new BookingFlowPage(page));
  },
  bookingsPage: async ({ page }, use) => {
    await use(new BookingsPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  roleSwitcherPage: async ({ page }, use) => {
    await use(new RoleSwitcherPage(page));
  },
  consoleCollector: async ({ page }, use) => {
    const collector = new ConsoleCollector(page);
    await collector.start();
    await use(collector);
  },
  apiMonitor: async ({ page }, use) => {
    const monitor = new ApiMonitor(page);
    await monitor.start();
    await use(monitor);
  },
});

export { expect } from '@playwright/test';
