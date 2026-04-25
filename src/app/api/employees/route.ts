import { NextResponse } from "next/server";
import { getEmployees, addEmployee, deleteEmployee, clearAllEmployees, batchAddEmployees } from "@/lib/db";

// 获取所有员工
export async function GET() {
  try {
    const employees = await getEmployees();
    return NextResponse.json(employees);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 添加单个员工
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 支持批量添加
    if (Array.isArray(body)) {
      const count = await batchAddEmployees(body);
      return NextResponse.json({ success: true, count });
    }
    await addEmployee(body);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 清空或删除
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      await deleteEmployee(id);
    } else {
      await clearAllEmployees();
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
