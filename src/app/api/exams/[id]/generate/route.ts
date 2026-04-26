import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exam = await store.getExam(id);

  if (!exam) {
    return NextResponse.json({ error: "考试不存在" }, { status: 404 });
  }

  if (exam.mode !== "random") {
    return NextResponse.json({ questions: exam.questions });
  }

  const sel = exam.questionSelection;
  if (!sel || !sel.rules || sel.rules.length === 0) {
    return NextResponse.json({ error: "考试未设置随机选题规则" }, { status: 400 });
  }

  // 读取题库
  const allQuestions = await store.getQuestions();

  // 按分类过滤
  let pool = [...allQuestions];
  if (sel.categories && sel.categories.length > 0) {
    const catSet = new Set(sel.categories.map((c: string) => c.trim()));
    pool = pool.filter((q) => {
      const qc = (q.category || "").trim();
      return catSet.has(qc) || [...catSet].some((c) => qc.includes(c) || c.includes(qc));
    });
  }

  // 按规则抽题
  const result: any[] = [];
  for (const rule of sel.rules) {
    const typedPool = pool.filter((q) => q.type === rule.type);
    // 洗牌 + 截取
    const shuffled = [...typedPool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(rule.count, shuffled.length));
    picked.forEach((q) => {
      result.push({
        id: q.id,
        type: q.type,
        text: q.text,
        options: q.options || [],
        correctAnswer: q.correctAnswer || [],
        score: rule.score,
      });
    });
  }

  // 洗牌
  result.sort(() => Math.random() - 0.5);

  return NextResponse.json({
    questions: result,
    stats: {
      totalInBank: allQuestions.length,
      afterCategoryFilter: pool.length,
      generated: result.length,
    },
  });
}
