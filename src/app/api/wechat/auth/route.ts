import { NextResponse } from "next/server";

// 企业微信 OAuth 回调，获取用户信息
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", req.url));
  }

  const corpId = process.env.WECHAT_CORP_ID;
  const agentId = process.env.WECHAT_AGENT_ID;
  const secret = process.env.WECHAT_AGENT_SECRET;

  if (!corpId || !secret) {
    return NextResponse.json({ error: "未配置企业微信" }, { status: 500 });
  }

  try {
    // 1. 获取 access_token
    const tokenRes = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${secret}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL(`/login?error=token_fail&msg=${tokenData.errmsg}`, req.url));
    }

    const accessToken = tokenData.access_token;

    // 2. 用 code 获取用户信息
    const userRes = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token=${accessToken}&code=${code}`
    );
    const userData = await userRes.json();

    if (!userData.UserId && !userData.OpenId) {
      return NextResponse.redirect(new URL(`/login?error=user_fail&msg=${userData.errmsg || "获取用户失败"}`, req.url));
    }

    const userId = userData.UserId || userData.OpenId;
    const userTicket = userData.user_ticket;

    let userName = userId;
    let userAvatar = "";

    // 3. 如果有 user_ticket，获取详细信息
    if (userTicket) {
      try {
        const detailRes = await fetch(
          `https://qyapi.weixin.qq.com/cgi-bin/auth/getuserdetail?access_token=${accessToken}`,
          {
            method: "POST",
            body: JSON.stringify({ user_ticket: userTicket }),
            headers: { "Content-Type": "application/json" },
          }
        );
        const detailData = await detailRes.json();
        if (detailData.name) userName = detailData.name;
        if (detailData.avatar) userAvatar = detailData.avatar;
      } catch {}
    }

    // 4. 重定向到前端，携带用户信息
    const returnUrl = new URL("/study", req.url);
    returnUrl.searchParams.set("wx_user", userId);
    returnUrl.searchParams.set("wx_name", userName);
    if (userAvatar) returnUrl.searchParams.set("wx_avatar", userAvatar);
    returnUrl.searchParams.set("wx_login", "1");

    return NextResponse.redirect(returnUrl);
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/login?error=${e.message}`, req.url));
  }
}
