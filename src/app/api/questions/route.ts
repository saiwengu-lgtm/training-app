import { NextRequest, NextResponse } from "next/server";
import * as store from "@/lib/store";

// 获取所有题目
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let questions = await store.getQuestions();

    if (category) {
      questions = questions.filter((q) => q.category === category);
    }

    const categories = await store.getQuestionCategories();

    return NextResponse.json({ questions, categories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 批量添加题目
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      let added = 0;
      for (const item of body) {
        const q = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
          category: item.category || "",
          type: item.type || "single",
          text: item.text || "",
          options: item.options || [],
          correctAnswer: item.correctAnswer || [],
          score: item.score || 1,
          tags: item.tags || [],
          createdAt: new Date().toISOString(),
        };
        await store.addQuestion(q);
        added++;
      }
      return NextResponse.json({ success: true, count: added });
    }

    // 单个
    const q = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      category: body.category || "",
      type: body.type || "single",
      text: body.text || "",
      options: body.options || [],
      correctAnswer: body.correctAnswer || [],
      score: body.score || 1,
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
    };
    await store.addQuestion(q);
    return NextResponse.json({ success: true, question: q });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 删除单题 / 清空
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      await store.deleteQuestion(id);
    } else {
      await store.clearAllQuestions();
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
