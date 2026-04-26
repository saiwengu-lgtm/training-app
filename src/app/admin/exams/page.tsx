"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定删除考试「${title}」？`)) return;
    await fetch(`/api/exams?id=${id}`, { method: "DELETE" });
    setExams(exams.filter((e: any) => e.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
        <Link
          href="/admin/exams/new"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          创建考试
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ClipboardList className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">暂无考试</p>
          <p className="text-sm mt-1">点击上方「创建考试」</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam: any) => (
            <div key={exam.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {exam.questions?.length || 0} 题 · 及格 {exam.passingScore} 分
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 mt-1">
                    {exam.createdAt?.slice(0, 10)}
                  </span>
                  <button
                    onClick={() => handleDelete(exam.id, exam.title)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
