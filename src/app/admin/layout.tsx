"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ClipboardList, BarChart3, Users, Home, LogOut, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin/questions", label: "题库管理", icon: HelpCircle },
  { href: "/admin/courses", label: "课程管理", icon: BookOpen },
  { href: "/admin/exams", label: "考试管理", icon: ClipboardList },
  { href: "/admin/results", label: "成绩查看", icon: BarChart3 },
  { href: "/admin/employees", label: "员工管理", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  // 如果正在登录页，直接渲染（不检查权限）
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
    } else {
      setAuthed(true);
    }
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex h-screen w-56 flex-col border-r bg-white">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="text-lg font-bold">爱立德员工培训中心</Link>
          <span className="ml-2 text-xs text-gray-400">管理端</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3 space-y-1">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            <Home className="h-4 w-4" />
            返回首页
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
