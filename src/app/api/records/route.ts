import { NextResponse } from "next/server";
import { getWatchRecord, upsertWatchRecord, getWatchRecords, getExamRecords, getAllExamRecords } from "@/lib/store";
import type { WatchRecord } from "@/lib/types";

// 获取用户记录（观看+考试）
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "default";

  const watched = getWatchRecords(userId);
  const exams = getExamRecords(userId);

  return NextResponse.json({ watched, exams });
}

// 更新观看进度
export async function POST(req: Request) {
  const { userId, courseId, progress } = await req.json();
  if (userId === undefined || !courseId || progress === undefined) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const existing = getWatchRecord(userId, courseId);
  const p = Math.min(100, Math.max(0, progress));

  const record: WatchRecord = {
    id: existing?.id || Date.now().toString(),
    userId,
    courseId,
    progress: existing ? Math.max(existing.progress, p) : p,
    completed: p >= 100,
    updatedAt: new Date().toISOString(),
  };

  upsertWatchRecord(record);
  return NextResponse.json({ record });
}

// 获取所有考试记录（管理端用）
export async function PUT() {
  const allExamRecords = getAllExamRecords();
  return NextResponse.json({ records: allExamRecords });
}
