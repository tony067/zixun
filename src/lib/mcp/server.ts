import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "@/lib/db/client";
import { counselors, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "mindpace",
    version: "1.0.0",
  });

  server.tool("list-counselors", "List approved counselors", {}, async () => {
    const list = await db.select({
      id: counselors.id,
      displayName: counselors.displayName,
      specialties: counselors.specialties,
      pricePerSession: counselors.pricePerSession,
    }).from(counselors).where(eq(counselors.reviewStatus, "approved"));
    return { content: [{ type: "text", text: JSON.stringify(list) }] };
  });

  server.tool("get-my-bookings", "Get bookings for current user", {}, async () => {
    const list = await db.select().from(bookings).where(eq(bookings.clientId, userId));
    return { content: [{ type: "text", text: JSON.stringify(list) }] };
  });

  return server;
}
