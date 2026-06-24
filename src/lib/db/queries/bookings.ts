import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { counselors } from "@/lib/db/schema/counselors";
import { users } from "@/lib/db/schema/users";

export async function createBooking(data: {
  id: string;
  clientId: string;
  counselorId: string;
  scheduledAt: Date;
  durationMinutes?: number;
  sessionMode?: string;
  priceAmount?: number;
  clientNote?: string;
  applicationForm?: Record<string, unknown> | null;
  agreementSigned?: boolean;
  sessionNumber?: number;
}) {
  const [b] = await db.insert(bookings).values(data).returning();
  return b;
}

export async function getClientBookings(clientId: string) {
  return db.select({
    id: bookings.id,
    status: bookings.status,
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
    sessionMode: bookings.sessionMode,
    priceAmount: bookings.priceAmount,
    clientNote: bookings.clientNote,
    counselorNote: bookings.counselorNote,
    createdAt: bookings.createdAt,
    counselor: {
      id: counselors.id,
      displayName: counselors.displayName,
      title: counselors.title,
      avatarUrl: counselors.avatarUrl,
    },
  })
  .from(bookings)
  .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
  .where(eq(bookings.clientId, clientId))
  .orderBy(desc(bookings.scheduledAt));
}

export async function getCounselorBookings(counselorId: string) {
  return db.select({
    id: bookings.id,
    status: bookings.status,
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
    sessionMode: bookings.sessionMode,
    priceAmount: bookings.priceAmount,
    clientNote: bookings.clientNote,
    counselorNote: bookings.counselorNote,
    applicationForm: bookings.applicationForm,
    createdAt: bookings.createdAt,
    client: {
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    },
  })
  .from(bookings)
  .leftJoin(users, eq(bookings.clientId, users.id))
  .where(eq(bookings.counselorId, counselorId))
  .orderBy(desc(bookings.scheduledAt));
}

export async function updateBookingStatus(id: string, status: string, counselorNote?: string) {
  const [b] = await db.update(bookings)
    .set({ status, ...(counselorNote !== undefined ? { counselorNote } : {}) })
    .where(eq(bookings.id, id))
    .returning();
  return b;
}

export async function getAllBookings() {
  return db.select({
    id: bookings.id,
    status: bookings.status,
    scheduledAt: bookings.scheduledAt,
    durationMinutes: bookings.durationMinutes,
    sessionMode: bookings.sessionMode,
    priceAmount: bookings.priceAmount,
    createdAt: bookings.createdAt,
    counselor: {
      id: counselors.id,
      displayName: counselors.displayName,
    },
    client: {
      id: users.id,
      name: users.name,
      email: users.email,
    },
  })
  .from(bookings)
  .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
  .leftJoin(users, eq(bookings.clientId, users.id))
  .orderBy(desc(bookings.createdAt));
}
