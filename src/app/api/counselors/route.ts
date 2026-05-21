import { NextRequest, NextResponse } from "next/server";
import { getCounselors, seedCounselors } from "@/lib/db/queries/counselors";

export async function GET(req: NextRequest) {
  try {
    await seedCounselors(); // idempotent — onConflictDoNothing
    const sp = req.nextUrl.searchParams;
    const list = await getCounselors({
      specialty: sp.get("specialty") ?? undefined,
      search: sp.get("q") ?? undefined,
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
