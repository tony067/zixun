import { db } from "@/lib/db/client";
import { conversations, messages, users } from "@/lib/db/schema";
import { eq, or, and, desc } from "drizzle-orm";

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
  const rows = await db.select({
    conv: conversations,
    otherUser: {
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    },
  })
  .from(conversations)
  .leftJoin(users, or(
    and(eq(conversations.participantAId, userId), eq(users.id, conversations.participantBId)),
    and(eq(conversations.participantBId, userId), eq(users.id, conversations.participantAId)),
  ))
  .where(or(eq(conversations.participantAId, userId), eq(conversations.participantBId, userId)))
  .orderBy(desc(conversations.lastMessageAt));
  return rows;
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
