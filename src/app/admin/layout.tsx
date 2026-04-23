"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, BarChart3, Home } from "lucide-react";

const navItems = [
  { href: "/admin/courses", label: "课程管理", icon: BookOpen },
  { href: "/admin/exams", label: "考试管理", icon: ClipboardList },
  { href: "/admin/results", label: "成绩查看", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="flex h-screen w-56 flex-col border-r bg-white">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="text-lg font-bold">培训系统</Link>
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
        <div className="border-t p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            <Home className="h-4 w-4" />
            返回首页
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
