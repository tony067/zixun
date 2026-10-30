import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 预约流程 POM（对齐真实档期 + 真实提交版）
 * 真实类名来源：src/pages/booking-flow/index.module.scss
 *  - Step0 方案：pricingList > pricingItem/pricingActive（pricingName/pricingPrice/pricingDetail）
 *  - Step1 方式+时间：modeItem/modeActive/modeLabel；dateList > dateItem/dateActive/dateDisabled（dateWeek/dateDay）
 *    时段分组 slotGroup > slotGroupLabel（上午/下午/晚间）+ slotItem/slotActive/slotBooked（slotText "09:00–09:50"）
 *    底部 nextButton（未选时段时叠加 buttonDisabled 类）+ selectedInfo
 *  - Step2 表单：summaryCard（预约摘要）/ formInput / purposeItem / checkBox / errorMsg
 *    底部 backButton（"上一步"）+ submitButton（"提交预约 · ￥X"，提交中 disabled）
 *  - 提交：POST /api/bookings（pricingOptionId/durationMinutes/priceAmount/sessionNumber 等）
 */
export class BookingFlowPage extends BasePage {
  readonly pricingOptions: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly sessionModes: Locator;
  readonly dateScroller: Locator;
  readonly timeSlots: Locator;
  readonly submitButton: Locator;
  readonly clientNoteInput: Locator;
  readonly agreementCheckbox: Locator;
  readonly stepIndicator: Locator;
  // 新增：真实档期
  readonly dateItems: Locator;
  readonly activeDateItem: Locator;
  readonly disabledDateItems: Locator;
  readonly slotGroupLabels: Locator;
  readonly selectedSlotItem: Locator;
  readonly selectedInfo: Locator;
  // 新增：Step2 表单
  readonly summaryCard: Locator;
  readonly summaryInfo: Locator;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly wechatInput: Locator;
  readonly purposeItems: Locator;
  readonly errorMsg: Locator;

  constructor(page: Page) {
    super(page);
    // 真实方案行 class 为 `index-module__pricingItem___<hash>`
    this.pricingOptions = page.locator('[class*="pricingItem"]');
    this.nextButton = page.locator('[class*="nextButton"]').first();
    this.backButton = page.getByText('上一步', { exact: true }).first();
    // 真实方式标签 class 为 `index-module__modeItem___<hash>`（整个卡片可点）
    this.sessionModes = page.locator('[class*="modeItem"]');
    // Step1 日期行容器
    this.dateScroller = page.locator('[class*="dateList"]').first();
    this.dateItems = page.locator('[class*="dateItem"]');
    this.activeDateItem = page.locator('[class*="dateActive"]');
    this.disabledDateItems = page.locator('[class*="dateDisabled"]');
    // 时段：slotItem（"09:00–09:50"），slotGroupLabel 为 上午/下午/晚间 分组标题
    this.timeSlots = page.locator('[class*="slotItem"]');
    this.slotGroupLabels = page.locator('[class*="slotGroupLabel"]');
    this.selectedSlotItem = page.locator('[class*="slotActive"]');
    this.selectedInfo = page.locator('[class*="selectedInfo"]').first();
    this.submitButton = page.locator('[class*="submitButton"]').first();
    this.clientNoteInput = page
      .locator('[class*="noteTextarea"] textarea, textarea[placeholder*="补充说明"]')
      .first();
    // 自绘协议勾选框（点击整行 agreementCheck 切换）
    this.agreementCheckbox = page.locator('[class*="agreementCheck"]').first();
    this.stepIndicator = page.locator('[class*="stepIndicator"]').first();
    // Step2
    this.summaryCard = page.locator('[class*="summaryCard"]').first();
    this.summaryInfo = page.locator('[class*="summaryInfo"]');
    this.nameInput = page.locator('input[placeholder*="真实姓名"]').first();
    this.phoneInput = page.locator('input[placeholder="必填"]').first();
    this.wechatInput = page.locator('input[placeholder="选填"]').first();
    this.purposeItems = page.locator('[class*="purposeItem"]');
    this.errorMsg = page.locator('[class*="errorMsg"]').first();
  }

  async open(counselorId: string): Promise<void> {
    await this.goto(`/#/pages/booking-flow/index?id=${counselorId}`);
    await this.pricingOptions.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  async selectPricing(index: number = 0): Promise<void> {
    // priceRow 可能只是展示行，点击它本身可能不会触发选择。
    // 尝试点击行内任意可交互子元素，失败则点击行本身
    const row = this.pricingOptions.nth(index);
    try {
      await row.click({ timeout: 5000 });
    } catch {
      // 兜底：用 evaluate 触发 click 事件
      await row.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  async clickNext(): Promise<void> {
    const btn = this.nextButton;
    try {
      await btn.click({ timeout: 5000 });
    } catch {
      await btn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  /** Step1（选择方式/时间）是否已显示 */
  async isStep1Visible(): Promise<boolean> {
    return await this.dateScroller
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }

  /** Step2（填写信息）是否已显示 */
  async isStep2Visible(): Promise<boolean> {
    return await this.summaryCard
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  async selectSessionMode(index: number = 0): Promise<void> {
    await this.sessionModes.nth(index).click();
  }

  /** 点击第 index 个日期（含置灰日也可点，选中后时段重置为空） */
  async selectDate(index: number = 0): Promise<void> {
    await this.dateItems.nth(index).click();
  }

  /** 按开始时间选择时段（slotText 为 "09:00–09:50"） */
  async selectTimeSlotByStart(start: string): Promise<void> {
    await this.timeSlots.filter({ hasText: start }).first().click();
  }

  async selectTimeSlot(index: number = 0): Promise<void> {
    await this.timeSlots.nth(index).click();
  }

  /** 读取时段分组标题（上午/下午/晚间） */
  async getSlotGroupLabels(): Promise<string[]> {
    const labels: string[] = [];
    const count = await this.slotGroupLabels.count();
    for (let i = 0; i < count; i++) {
      labels.push(((await this.slotGroupLabels.nth(i).textContent()) || '').trim());
    }
    return labels;
  }

  async fillClientNote(text: string): Promise<void> {
    await this.clientNoteInput.fill(text);
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  /** 勾选《用户服务协议》自绘复选框（点击整行） */
  async checkAgreement(): Promise<void> {
    const row = this.agreementCheckbox;
    try {
      await row.click({ timeout: 5000 });
    } catch {
      await row.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  /** 选择第 index 个咨询目的 pill */
  async selectPurpose(index: number = 0): Promise<void> {
    await this.purposeItems.nth(index).click();
  }

  async submit(): Promise<void> {
    const btn = this.submitButton;
    // 防重守卫：提交中（Taro Button disabled/loading）时不再触发点击，
    // 避免兜底 evaluate(el.click()) 绕过 disabled 造成重复提交
    if (await this.isSubmitDisabled().catch(() => false)) return;
    try {
      await btn.click({ timeout: 5000 });
    } catch {
      if (await this.isSubmitDisabled().catch(() => false)) return;
      await btn.evaluate((el) => (el as HTMLElement).click()).catch(() => {});
    }
  }

  /** 提交按钮是否处于禁用/防重状态（disabled 属性或 buttonDisabled 类） */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.evaluate((el) => {
      const anyEl = el as HTMLButtonElement;
      const cls = anyEl.className || '';
      // 实现说明：React 对自定义元素（taro-button-core）会把 disabled={false} 也渲染成
      // disabled="false" 属性，因此只有值为 "true" 或空串才代表真正禁用
      const disabledAttr = anyEl.getAttribute('disabled');
      return (
        disabledAttr === '' ||
        disabledAttr === 'true' ||
        anyEl.getAttribute('aria-disabled') === 'true' ||
        /buttonDisabled/i.test(cls) ||
        // Taro Button loading=true 时在 taro-button-core 内渲染 <i class="weui-loading">
        !!anyEl.querySelector('.weui-loading')
      );
    });
  }

  /** Step1 下一步按钮是否因未选时段而禁用（buttonDisabled 类） */
  async isNextDisabled(): Promise<boolean> {
    const cls = (await this.nextButton.getAttribute('class')) || '';
    return /buttonDisabled/i.test(cls);
  }

  async expectNextButtonDisabled(): Promise<void> {
    expect(await this.isNextDisabled()).toBeTruthy();
  }

  async expectNextButtonEnabled(): Promise<void> {
    expect(await this.isNextDisabled()).toBeFalsy();
  }

  async expectSubmitButtonDisabled(): Promise<void> {
    expect(await this.isSubmitDisabled()).toBeTruthy();
  }

  async completeBooking(counselorId: string, clientNote: string = '测试预约'): Promise<void> {
    await this.open(counselorId);
    await this.selectPricing(0);
    await this.clickNext();
    await this.selectSessionMode(0);
    await this.selectDate(0);
    await this.selectTimeSlot(0);
    await this.clickNext();
    await this.fillClientNote(clientNote);
    await this.checkAgreement();
    await this.submit();
  }
}

/**
 * 构造 GET /api/counselors/{id}/available-slots 的 mock 响应
 * 服务端结构：{ days: [{ date: "YYYY-MM-DD", label: "M/D", weekday: "周X", slots: ["HH:mm"] }] }
 */
export function buildSlotDays(defs: Array<{ offset: number; slots: string[] }>) {
  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    days: defs.map(({ offset, slots }) => {
      const d = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      return { date, label, weekday: WEEKDAYS[d.getDay()], slots };
    }),
  };
}

/**
 * 构造 GET /api/counselors/{id} 咨询师详情 mock（用于档期/提交流程确定性）
 * sessionDuration=50 → 09:00 时段结束时间 09:50
 */
export function buildMockCounselor(overrides: Record<string, any> = {}) {
  return {
    id: 'c-e2e-slot',
    name: '档期测试咨询师',
    bio: '自动化测试用虚拟咨询师简介',
    tagline: '与你一起慢慢变好',
    specialties: ['情绪困扰'],
    counselorTypes: ['心理咨询师'],
    sessionModes: ['视频'],
    sessionDuration: 50,
    pricePerSession: 400,
    pricingOptions: [
      { id: 'po-e2e-1', name: '单次咨询', price: 400, duration: 50, sessions: 1 },
      { id: 'po-e2e-2', name: '深度咨询', price: 600, duration: 80, sessions: 1 },
    ],
    isAccepting: true,
    location: '广东 广州',
    avatarUrl: null,
    ...overrides,
  };
}

/**
 * 构造 POST /api/bookings 成功响应体（normalizeBooking 可解析的订单结构）
 */
export function buildBookingResponse(payload: Record<string, any>) {
  const now = new Date().toISOString();
  return {
    id: `bk-e2e-${Date.now()}`,
    counselorId: payload?.counselorId || 'c-e2e-slot',
    counselor: { id: payload?.counselorId || 'c-e2e-slot', displayName: '档期测试咨询师', avatarUrl: null, title: '' },
    scheduledAt: payload?.scheduledAt || now,
    durationMinutes: payload?.durationMinutes || 50,
    sessionMode: payload?.sessionMode || '视频咨询',
    priceAmount: payload?.priceAmount || 400,
    status: 'pending_confirmation',
    clientNote: payload?.clientNote || '',
    createdAt: now,
    updatedAt: now,
  };
}

/** 供 spec 判断 mock 时段结束时间的工具：开始+分钟数 */
export function addMinutes(start: string, minutes: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
