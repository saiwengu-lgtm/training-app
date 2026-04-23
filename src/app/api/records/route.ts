import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import type { WatchRecord } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "default";

  const watched = await store.getWatchRecords(userId);
  const exams = await store.getExamRecords(userId);

  return NextResponse.json({ watched, exams });
}

export async function POST(req: Request) {
  const { userId, courseId, progress } = await req.json();
  if (userId === undefined || !courseId || progress === undefined) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const existing = await store.getWatchRecord(userId, courseId);
  const p = Math.min(100, Math.max(0, progress));

  const record: WatchRecord = {
    id: existing?.id || Date.now().toString(),
    userId,
    courseId,
    progress: existing ? Math.max(existing.progress, p) : p,
    completed: p >= 100,
    updatedAt: new Date().toISOString(),
  };

  await store.upsertWatchRecord(record);
  return NextResponse.json({ record });
}

export async function PUT() {
  const records = await store.getAllExamRecords();
  return NextResponse.json({ records });
}
