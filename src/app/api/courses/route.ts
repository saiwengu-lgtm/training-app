import { NextResponse } from "next/server";
import { getCourses, addCourse } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ courses: getCourses() });
}

export async function POST(req: Request) {
  const data = await req.json();
  const course = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  addCourse(course);
  return NextResponse.json({ course });
}
