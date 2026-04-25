import { NextResponse } from "next/server";

// 企业微信域名验证文件
export async function GET() {
  return new NextResponse("UkqrGkZeVSZL0jVF", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
