import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { selectQuestions, getExamTotalScore } from "@/lib/questionSelector";
import type { Question } from "@/lib/types";

/**
 * POST /api/exams/[id]/generate
 * 为学员从题库中随机抽题（每次重考重新抽）
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await req.json();
  const exam = await store.getExam(id);

  if (!exam) {
    return NextResponse.json({ error: "考试不存在" }, { status: 404 });
  }

  if (exam.mode !== "random" || !exam.questionSelection) {
    return NextResponse.json({ error: "该考试不是随机模式" }, { status: 400 });
  }

  // 从题库加载
  const bank = await store.getQuestions();

  // 随机选题
  const questions: Question[] = selectQuestions(bank, exam.questionSelection);
  const totalScore = exam.questionSelection.rules.reduce(
    (s, r) => s + r.count * r.score,
    0
  );

  return NextResponse.json({
    questions,
    total: totalScore,
    passingScore: exam.passingScore,
  });
}
