import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function GET() {
  try {
    const questions = await store.getQuestions();
    const single = questions.filter((q: any) => q.type === "single").length;
    const multiple = questions.filter((q: any) => q.type === "multiple").length;
    const judge = questions.filter((q: any) => q.type === "judge").length;
    const cats = [...new Set(questions.map((q: any) => q.category))];
    const sample = questions.slice(0, 3).map((q: any) => ({
      category: q.category,
      type: q.type,
      text: q.text?.slice(0, 30),
    }));
    return NextResponse.json({ total: questions.length, single, multiple, judge, categories: cats, sample });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
