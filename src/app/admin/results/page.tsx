"use client";

import { useState, useEffect } from "react";
import type { Exam, ExamRecord, Course } from "@/lib/types";

export default function AdminResultsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [results, setResults] = useState<ExamRecord[]>([]);

  function loadData() {
    fetch("/api/exams").then((r) => r.json()).then((d) => setExams(d.exams));
    fetch("/api/courses").then((r) => r.json()).then((d) => setCourses(d.courses));
  }

  useEffect(() => { loadData(); }, []);

  // 从submit接口收集记录（当前无法直接遍历所有记录，显示提示）
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">成绩查看</h1>
          <p className="text-sm text-gray-500 mt-1">查看员工考试结果和学习进度</p>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold">{courses.length}</div>
          <div className="text-sm text-gray-500">课程总数</div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold">{exams.length}</div>
          <div className="text-sm text-gray-500">考试总数</div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold">-</div>
          <div className="text-sm text-gray-500">参与人次（待开发）</div>
        </div>
      </div>

      {/* 考试列表 */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">考试列表</h2>
        </div>
        <div className="divide-y">
          {exams.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">
              暂无考试数据
            </div>
          )}
          {exams.map((exam) => {
            const totalScore = exam.questions.reduce((s, q) => s + (q.score || 1), 0);
            const typeCount = exam.questions.length;
            return (
              <div key={exam.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium text-sm">{exam.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {typeCount}题 · 共{totalScore}分 · 及格线{exam.passingScore}分
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                    暂未统计
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
