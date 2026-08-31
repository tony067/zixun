import { db } from "@/lib/db/client";
import { conversations, messages, users } from "@/lib/db/schema";
import { eq, or, and, desc, sql, ne } from "drizzle-orm";

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

export async function getUserConversations(userId: string) {
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
  return rows;
}

/** 总未读消息数（用于底部导航红点） */
export async function getTotalUnreadCount(userId: string) {
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
  return row?.cnt ?? 0;
}

/** 标记某个会话的所有"别人发的"消息为已读 */
export async function markConversationRead(conversationId: string, userId: string) {
  await db.update(messages)
    .set({ isRead: true })
    .where(and(
      eq(messages.conversationId, conversationId),
      eq(messages.isRead, false),
      ne(messages.senderId, userId),
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
