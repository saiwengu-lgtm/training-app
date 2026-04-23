import { NextResponse } from "next/server";
import { getExam, addExamRecord } from "@/lib/store";
import { scoreQuestion } from "@/lib/scoring";
import type { ExamRecord } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, answers } = await req.json();
  const exam = getExam(id);

  if (!exam) {
    return NextResponse.json({ error: "考试不存在" }, { status: 404 });
  }

  // 逐题评分
  const detail = exam.questions.map((q, i) => {
    const result = scoreQuestion(q, answers[i]);
    return {
      qId: q.id,
      type: q.type,
      score: result.score,
      maxScore: result.maxScore,
    };
  });

  const totalScore = detail.reduce((s, d) => s + d.score, 0);
  const totalMax = detail.reduce((s, d) => s + d.maxScore, 0);
  const passed = totalScore >= exam.passingScore;

  const record: ExamRecord = {
    id: Date.now().toString(),
    userId,
    examId: id,
    answers,
    score: totalScore,
    total: totalMax,
    detail,
    passed,
    completedAt: new Date().toISOString(),
  };

  addExamRecord(record);
  return NextResponse.json({ record });
}
