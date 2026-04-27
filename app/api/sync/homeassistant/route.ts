import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncHomeAssistantHistory } from "@/lib/homeassistant";

export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET;
  if (secret && request.headers.get("x-sync-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const log = await prisma.syncLog.create({
    data: {
      source: "homeassistant",
      status: "running",
      startedAt
    }
  });

  try {
    const payload = await request.json().catch(() => ({}));
    const from = payload.from ? new Date(payload.from) : undefined;
    const to = payload.to ? new Date(payload.to) : undefined;
    const result = await syncHomeAssistantHistory(from, to);

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        rowsInserted: result.inserted,
        message: `Synced ${result.entities} entities from ${result.from.toISOString()} to ${result.to.toISOString()}`
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        message: error instanceof Error ? error.message : "unknown error"
      }
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 }
    );
  }
}
