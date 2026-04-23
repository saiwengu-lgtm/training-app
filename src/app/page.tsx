import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 导航 */}
      <nav className="flex items-center justify-between border-b bg-white/80 backdrop-blur-sm px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-lg text-gray-800">企业培训系统</span>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="text-6xl mb-6">🚀</div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
            在线培训平台
          </h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            课程学习 · 在线考试 · 自动评分 · 进度追踪
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link
              href="/study"
              className="w-64 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-[0.98]"
            >
              🎬 进入学习
            </Link>
            <Link
              href="/admin/courses"
              className="w-64 rounded-xl border-2 border-gray-200 bg-white px-8 py-3.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
            >
              ⚙️ 管理后台
            </Link>
          </div>

          <div className="mt-12 flex justify-center gap-8 text-sm text-gray-400">
            <span>📹 视频课程</span>
            <span>📝 在线考试</span>
            <span>📊 进度追踪</span>
          </div>
        </div>
      </div>
    </div>
  );
}
