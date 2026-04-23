import { NextResponse } from "next/server";
import { getCourse, updateCourse, deleteCourse } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ course });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  updateCourse(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteCourse(id);
  return NextResponse.json({ ok: true });
}
