import { NextResponse } from "next/server";
import { getEmployeeByLogin, updateEmployeeBrowserId } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, employeeId, browserId } = await req.json();

    if (!name || !employeeId) {
      return NextResponse.json({ error: "请输入姓名和工号" }, { status: 400 });
    }

    const emp = await getEmployeeByLogin(name.trim(), employeeId.trim());
    if (!emp) {
      return NextResponse.json({ error: "姓名或工号不正确" }, { status: 401 });
    }

    // 绑定浏览器ID
    if (browserId) {
      await updateEmployeeBrowserId(emp.id, browserId);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        employeeId: emp.employeeId,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
