import { db } from "@/lib/db/client";
import { conversations, messages, users } from "@/lib/db/schema";
import { eq, or, and, desc, sql, ne, asc } from "drizzle-orm";

/**
 * 客服共享收件箱模型：
 * - 联系客服的会话固定挂在「官方客服账号」名下（最早的 support 用户，无则最早的 admin 用户）
 * - 管理员/客服（staff）即使不是会话参与者，也能查看和回复这类会话（共享收件箱）
 * - staff 回复时以官方客服账号身份发出（对来访展示统一的官方客服形象）
 * - 已读状态共享：任何 staff 读过，全员的红点一起消
 */

/** 官方客服账号 id */
export async function getOfficialStaffUserId(): Promise<string | null> {
  const [support] = await db.select({ id: users.id }).from(users).where(eq(users.role, "support")).orderBy(asc(users.createdAt));
  if (support) return support.id;
  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).orderBy(asc(users.createdAt));
  return admin?.id ?? null;
}

export function isStaffRole(role?: string | null) {
  return role === "admin" || role === "support";
}

/** 会话访问校验：参与者直接放行；staff 可访问客服会话（返回以官方身份作为 selfId） */
export async function canAccessConversation(conversationId: string, userId: string, role?: string | null) {
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!conv) return { ok: false as const, selfId: null, conv: null };
  if (conv.participantAId === userId || conv.participantBId === userId) {
    return { ok: true as const, selfId: userId, conv };
  }
  if (isStaffRole(role)) {
    const officialId = await getOfficialStaffUserId();
    if (officialId && (conv.participantAId === officialId || conv.participantBId === officialId)) {
      return { ok: true as const, selfId: officialId, conv };
    }
  }
  return { ok: false as const, selfId: null, conv: null };
}

export async function getOrCreateConversation(userAId: string, userBId: string) {
  const [existing] = await db.select().from(conversations)
    .where(
      or(
        and(eq(conversations.participantAId, userAId), eq(conversations.participantBId, userBId)),
        and(eq(conversations.participantAId, userBId), eq(conversations.participantBId, userAId)),
      )
    );
  if (existing) return existing;
  const [created] = await db.insert(conversations)
    .values({ id: `conv_${Date.now()}`, participantAId: userAId, participantBId: userBId })
    .returning();
  return created;
}

export async function getUserConversations(userId: string, role?: string | null) {
  // 每个会话：未读数 = 不是我发且 isRead=false 的消息数
  const unreadSub = db.select({
    conversationId: messages.conversationId,
    cnt: sql<number>`count(*)::int`.as("cnt"),
  })
  .from(messages)
  .where(and(eq(messages.isRead, false), ne(messages.senderId, userId)))
  .groupBy(messages.conversationId)
  .as("unread");

  const rows = await db.select({
    conv: conversations,
    otherUser: {
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    },
    unreadCount: sql<number>`coalesce(${unreadSub.cnt}, 0)`.as("unreadCount"),
  })
  .from(conversations)
  .leftJoin(users, or(
    and(eq(conversations.participantAId, userId), eq(users.id, conversations.participantBId)),
    and(eq(conversations.participantBId, userId), eq(users.id, conversations.participantAId)),
  ))
  .leftJoin(unreadSub, eq(unreadSub.conversationId, conversations.id))
  .where(or(eq(conversations.participantAId, userId), eq(conversations.participantBId, userId)))
  .orderBy(desc(conversations.lastMessageAt));

  // staff：追加共享收件箱 —— 挂在官方客服账号名下、自己不是参与者的会话
  if (isStaffRole(role)) {
    const officialId = await getOfficialStaffUserId();
    if (officialId && officialId !== userId) {
      const otherIdExpr = sql`case when ${conversations.participantAId} = ${officialId} then ${conversations.participantBId} else ${conversations.participantAId} end`;
      const staffUnread = db.select({
        conversationId: messages.conversationId,
        cnt: sql<number>`count(*)::int`.as("cnt"),
      })
      .from(messages)
      .where(and(eq(messages.isRead, false), ne(messages.senderId, officialId)))
      .groupBy(messages.conversationId)
      .as("staff_unread");

      const sharedRows = await db.select({
        conv: conversations,
        otherUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
        unreadCount: sql<number>`coalesce(${staffUnread.cnt}, 0)`.as("unreadCount"),
      })
      .from(conversations)
      .leftJoin(users, eq(users.id, otherIdExpr))
      .leftJoin(staffUnread, eq(staffUnread.conversationId, conversations.id))
      .where(and(
        or(eq(conversations.participantAId, officialId), eq(conversations.participantBId, officialId)),
        ne(conversations.participantAId, userId),
        ne(conversations.participantBId, userId),
      ))
      .orderBy(desc(conversations.lastMessageAt));

      const seen = new Set(rows.map(r => r.conv.id));
      for (const row of sharedRows) {
        if (!seen.has(row.conv.id)) rows.push(row);
      }
      rows.sort((a, b) => new Date(b.conv.lastMessageAt ?? 0).getTime() - new Date(a.conv.lastMessageAt ?? 0).getTime());
    }
  }
  return rows;
}

/** 总未读消息数（用于底部导航红点）；staff 额外计入共享客服会话的未读 */
export async function getTotalUnreadCount(userId: string, role?: string | null) {
  const [row] = await db.select({ cnt: sql<number>`count(*)::int` })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(and(
      eq(messages.isRead, false),
      ne(messages.senderId, userId),
      or(
        eq(conversations.participantAId, userId),
        eq(conversations.participantBId, userId),
      ),
    ));
  let count = row?.cnt ?? 0;

  if (isStaffRole(role)) {
    const officialId = await getOfficialStaffUserId();
    if (officialId && officialId !== userId) {
      const [shared] = await db.select({ cnt: sql<number>`count(*)::int` })
        .from(messages)
        .innerJoin(conversations, eq(conversations.id, messages.conversationId))
        .where(and(
          eq(messages.isRead, false),
          ne(messages.senderId, officialId),
          or(eq(conversations.participantAId, officialId), eq(conversations.participantBId, officialId)),
          ne(conversations.participantAId, userId),
          ne(conversations.participantBId, userId),
        ));
      count += shared?.cnt ?? 0;
    }
  }
  return count;
}

/** 标记某个会话的所有"别人发的"消息为已读；staff 打开非自己参与的客服会话时，按官方客服身份标记（共享已读） */
export async function markConversationRead(conversationId: string, userId: string, role?: string | null) {
  let markAsId = userId;
  if (isStaffRole(role)) {
    const officialId = await getOfficialStaffUserId();
    if (officialId && officialId !== userId) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
      const isParticipant = !!conv && (conv.participantAId === userId || conv.participantBId === userId);
      const isOfficialConv = !!conv && (conv.participantAId === officialId || conv.participantBId === officialId);
      if (conv && !isParticipant && isOfficialConv) markAsId = officialId;
    }
  }
  await db.update(messages)
    .set({ isRead: true })
    .where(and(
      eq(messages.conversationId, conversationId),
      eq(messages.isRead, false),
      ne(messages.senderId, markAsId),
    ));
}

export async function getConversationMessages(conversationId: string) {
  return db.select({
    msg: messages,
    sender: { id: users.id, name: users.name, email: users.email },
  })
  .from(messages)
  .leftJoin(users, eq(messages.senderId, users.id))
  .where(eq(messages.conversationId, conversationId))
  .orderBy(messages.createdAt);
}

export async function sendMessage(data: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
}) {
  const [msg] = await db.insert(messages).values(data).returning();
  await db.update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, data.conversationId));
  return msg;
}

export async function getConversationOtherUser(conversationId: string, myUserId: string) {
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!conv) return null;
  const otherId = conv.participantAId === myUserId ? conv.participantBId : conv.participantAId;
  const [other] = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users).where(eq(users.id, otherId));
  return other ?? null;
}
