import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function GET() {
  return NextResponse.json({ exams: await store.getExams() });
}

export async function POST(req: Request) {
  const data = await req.json();
  const exam = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  await store.addExam(exam);
  return NextResponse.json({ exam });
}
