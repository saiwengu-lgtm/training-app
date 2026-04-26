import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { scoreQuestion } from "@/lib/scoring";
import type { ExamRecord, Question } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, answers, snapshotQuestions } = await req.json();
  const exam = await store.getExam(id);

  if (!exam) {
    return NextResponse.json({ error: "考试不存在" }, { status: 404 });
  }

  // 判题用的题目列表
  let questions: Question[];
  if (exam.mode === "random") {
    // 随机模式：使用前端传来的快照
    if (!snapshotQuestions || snapshotQuestions.length === 0) {
      return NextResponse.json({ error: "缺少本次考试的题目快照" }, { status: 400 });
    }
    questions = snapshotQuestions;
  } else {
    questions = exam.questions;
  }

  const detail = questions.map((q, i) => {
    const result = scoreQuestion(q, answers[i]);
    return { qId: q.id, type: q.type, score: result.score, maxScore: result.maxScore };
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

  // 随机模式：保存本次题目快照
  if (exam.mode === "random") {
    record.snapshotQuestions = questions;
  }

  // 重考覆盖：删除该学员该考试的旧记录
  try {
    const prevRecord = await store.getLatestExamRecord(userId, id);
    if (prevRecord) {
      await store.deleteExamRecord(prevRecord.id);
    }
  } catch {}

  await store.addExamRecord(record);
  return NextResponse.json({ record });
}
