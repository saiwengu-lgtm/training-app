import { NextResponse } from "next/server";

// 获取企业微信扫码登录的授权 URL（使用企业微信的扫码授权方式）
export async function GET() {
  const corpId = process.env.WECHAT_CORP_ID;
  const agentId = process.env.WECHAT_AGENT_ID;
  if (!corpId || !agentId) {
    return NextResponse.json({ error: "未配置企业微信" }, { status: 500 });
  }

  const baseUrl = process.env.BASE_URL || `https://${process.env.VERCEL_URL || "localhost:3000"}`;
  const redirectUri = encodeURIComponent(`${baseUrl}/api/wechat/auth`);

  // 企业微信扫码授权
  // 注意：snsapi_privateinfo 扫码后可以获取用户详细信息
  const authUrl = `https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=${corpId}&agentid=${agentId}&redirect_uri=${redirectUri}&state=STATE`;

  return NextResponse.json({ url: authUrl });
}
