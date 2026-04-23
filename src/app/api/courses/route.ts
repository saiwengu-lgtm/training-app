import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function GET() {
  return NextResponse.json({ courses: await store.getCourses() });
}

export async function POST(req: Request) {
  const data = await req.json();
  const course = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  await store.addCourse(course);
  return NextResponse.json({ course });
}
