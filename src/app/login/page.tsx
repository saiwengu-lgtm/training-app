"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = searchParams.get("error");

  const handleWeChatLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wechat/login");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
      alert("获取登录链接失败");
    }
  };

  const handleGuestEntry = () => {
    const localId = localStorage.getItem("user_id") || "user_" + Date.now();
    localStorage.setItem("user_id", localId);
    router.push("/study");
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border bg-white p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900">登录</h1>
            <p className="text-sm text-gray-500 mt-1">选择登录方式</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              登录失败：{error === "no_code" ? "未获取到授权码" : error === "token_fail" ? "获取Token失败" : error === "user_fail" ? "获取用户信息失败" : error}
            </div>
          )}

          <button
            onClick={handleWeChatLogin}
            disabled={loading}
            className="w-full rounded-xl bg-[#07C160] py-3.5 text-white font-medium text-base shadow-lg shadow-green-200 hover:bg-[#06AD56] hover:shadow-xl hover:shadow-green-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.324-1.233a.49.49 0 01.177-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.777-7.062-6.122zm-2.18 2.653c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.36 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
                </svg>
                微信扫码登录
              </>
            )}
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-400">或</span>
            </div>
          </div>

          <button
            onClick={handleGuestEntry}
            className="w-full rounded-xl border-2 border-gray-200 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            👤 访客进入（无需登录）
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            企业微信扫码登录，自动识别您的身份
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <nav className="flex items-center justify-between border-b bg-white/80 backdrop-blur-sm px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-lg text-gray-800">企业培训系统</span>
        </div>
      </nav>
      <Suspense fallback={<div className="flex flex-1 items-center justify-center p-6"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
