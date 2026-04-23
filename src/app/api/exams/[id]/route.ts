import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await store.getExam(id);
  if (!exam) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ exam });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  await store.updateExam(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await store.deleteExam(id);
  return NextResponse.json({ ok: true });
}
