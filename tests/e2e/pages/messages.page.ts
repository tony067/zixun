import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * 消息页 POM（新建：消息 tab = 会话列表 + 聊天视图）
 * 真实类名来源：src/pages/messages/index.module.scss
 *  - 会话列表：headerTitle / convList > convItem（convAvatar/convName/convTime/convPreview/convBadge 未读徽标）
 *  - 聊天视图：chatWrap > chatHeader（chatBack/chatName）+ chatScroll（msgRow/msgBubble/msgContent）+ chatInputBar（chatInput + sendBtn）
 *  - 未登录：emptyWrap（emptyTitle "请先登录查看消息" + loginBtn "去登录"）
 *  - TabBar 徽标与消息页同 DOM：custom-tab-bar 的 tabBadge（未读数联动）
 */
export class MessagesPage extends BasePage {
  readonly headerTitle: Locator;
  readonly convList: Locator;
  readonly convItems: Locator;
  readonly chatView: Locator;
  readonly chatName: Locator;
  readonly chatBack: Locator;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly messageBubbles: Locator;
  readonly tabBadge: Locator;
  readonly emptyTitle: Locator;
  readonly loginGateButton: Locator;

  constructor(page: Page) {
    super(page);
    this.headerTitle = page.locator('[class*="headerTitle"]').first();
    this.convList = page.locator('[class*="convList"]').first();
    this.convItems = page.locator('[class*="convItem"]');
    this.chatView = page.locator('[class*="chatWrap"]').first();
    this.chatName = page.locator('[class*="chatName"]').first();
    this.chatBack = page.locator('[class*="chatBack"]').first();
    // Taro H5 输入框：真实 <input> 在 taro-input-core 内，placeholder 可能挂在外层
    this.chatInput = page.locator('input[placeholder*="说点什么"]').first();
    this.sendButton = page.locator('[class*="sendBtn"]').first();
    this.messageBubbles = page.locator('[class*="msgBubble"]');
    // TabBar 在同一 DOM 中，消息 tab 的红色数字徽标
    // 实现说明：tabBadge 容器内还有 tabBadgeText，[class*="tabBadge"] 会子串误匹配内层 Text
    this.tabBadge = page.locator('[class*="tabBadge"]:not([class*="tabBadgeText"])').first();
    this.emptyTitle = page.locator('[class*="emptyTitle"]').first();
    this.loginGateButton = page.locator('[class*="loginBtn"]').filter({ hasText: '去登录' }).first();
  }

  async open(): Promise<void> {
    await this.goto('/#/pages/messages/index');
    // 实现说明：Taro hash 路由的页面层切换是异步的，networkidle 可能早于目标页
    // 渲染完成（DOM 中仍是登录页层）。显式等待消息页内容（会话列表或登录引导）
    // 出现后再执行查询。
    await this.page
      .waitForFunction(
        () => !!document.querySelector('[class*="convList"], [class*="emptyTitle"]'),
        undefined,
        { timeout: 15000 }
      )
      .catch(() => {});
  }

  /** 未登录：登录引导态 */
  async expectLoginGate(): Promise<void> {
    await expect(this.emptyTitle.filter({ hasText: '请先登录' })).toBeVisible();
    await expect(this.loginGateButton).toBeVisible();
  }

  async getConversationCount(): Promise<number> {
    return await this.convItems.count();
  }

  /** 按对方名称打开会话（进入聊天视图） */
  async openConversationByName(name: string): Promise<void> {
    await this.convItems.filter({ hasText: name }).first().click();
    await this.chatView.waitFor({ state: 'visible' }).catch(() => {});
  }

  /** 按序号打开会话 */
  async openConversationByIndex(index: number): Promise<void> {
    await this.convItems.nth(index).click();
    await this.chatView.waitFor({ state: 'visible' }).catch(() => {});
  }

  /** 会话列表第 index 项的未读徽标文案（无未读时返回 null，此时显示箭头） */
  async getConvBadgeText(index: number): Promise<string | null> {
    // 实现说明：convBadge 容器内还有 convBadgeText，[class*="convBadge"] 会子串误匹配内层 Text
    const badge = this.convItems
      .nth(index)
      .locator('[class*="convBadge"]:not([class*="convBadgeText"])');
    if ((await badge.count()) === 0) return null;
    return ((await badge.textContent()) || '').trim() || null;
  }

  /** 聊天输入框输入并点击发送（乐观插入 + POST /api/messages/{id}） */
  async sendMessage(text: string): Promise<void> {
    await this.chatInput.fill(text);
    await this.sendButton.click();
  }

  async expectBubbleVisible(text: string): Promise<void> {
    await expect(this.messageBubbles.filter({ hasText: text }).first()).toBeVisible();
  }

  /** 聊天视图返回会话列表 */
  async goBackToList(): Promise<void> {
    await this.chatBack.click();
    await this.chatView.waitFor({ state: 'hidden' }).catch(() => {});
  }

  /** TabBar 未读徽标文案（无徽标返回 null） */
  async getTabBadgeText(): Promise<string | null> {
    if ((await this.tabBadge.count()) === 0) return null;
    return ((await this.tabBadge.textContent()) || '').trim() || null;
  }
}

/**
 * 构造 GET /api/messages 会话列表 mock 数据
 * 服务端返回结构：[{ conv: { id, lastMessageAt }, otherUser: { id, name, email }, unreadCount }]
 */
export function buildConversation(overrides: Record<string, any> = {}) {
  return {
    conv: { id: 'conv-test-1', lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    otherUser: { id: 'u-other-1', name: '官方客服', email: 'support@mindpace.test' },
    unreadCount: 0,
    ...overrides,
  };
}

/**
 * 构造 GET /api/messages/{convId} 聊天记录 mock 数据
 * 页面兼容数组或 { msgs, selfId, otherUser } 两种返回
 */
export function buildChatHistory(msgs: any[] = [], overrides: Record<string, any> = {}) {
  return {
    msgs,
    selfId: 'self-user-1',
    otherUser: { id: 'u-other-1', name: '官方客服', email: 'support@mindpace.test' },
    ...overrides,
  };
}

/** 单条聊天消息 */
export function buildChatMsg(overrides: Record<string, any> = {}) {
  return {
    msg: {
      id: `m-${Math.random().toString(36).slice(2, 8)}`,
      content: '你好',
      senderId: 'u-other-1',
      createdAt: new Date().toISOString(),
    },
    sender: { id: 'u-other-1', name: '官方客服', email: 'support@mindpace.test' },
    ...overrides,
  };
}
