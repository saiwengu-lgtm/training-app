import { NextResponse } from "next/server";
import { getExams, addExam } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ exams: getExams() });
}

export async function POST(req: Request) {
  const data = await req.json();
  const exam = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  addExam(exam);
  return NextResponse.json({ exam });
}
