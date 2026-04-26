import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    const ok = verifyAdmin(username, password);
    if (!ok) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 创建 session token (简单版)
    const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

    const res = NextResponse.json({ success: true, token });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      path: "/admin",
      maxAge: 86400 * 7, // 7 days
      sameSite: "lax",
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
