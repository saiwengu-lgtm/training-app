import { NextResponse } from "next/server";
import { getExam, updateExam, deleteExam } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = getExam(id);
  if (!exam) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ exam });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  updateExam(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteExam(id);
  return NextResponse.json({ ok: true });
}
