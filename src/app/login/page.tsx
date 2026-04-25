"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !empId.trim()) {
      setError("请输入姓名和工号");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const browserId = localStorage.getItem("user_id") || "user_" + Date.now();
      localStorage.setItem("user_id", browserId);

      const res = await fetch("/api/auth/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), employeeId: empId.trim(), browserId }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "登录失败");
        setLoading(false);
        return;
      }

      // 保存用户信息
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_department", data.user.department);
      localStorage.setItem("user_employee_id", data.user.employeeId);
      localStorage.setItem("user_id", data.user.id); // 用员工ID作为user_id

      router.push("/study");
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
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
            <p className="text-sm text-gray-500 mt-1">请输入您的姓名和工号</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名"
                disabled={loading}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工号</label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="请输入工号"
                disabled={loading}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !name.trim() || !empId.trim()}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-white font-medium text-base shadow-lg shadow-blue-200 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "登录"
              )}
            </button>
          </form>

          <div className="relative my-6">
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
            👤 访客进入
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            如无法登录，请联系管理员
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
