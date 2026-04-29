"use client";

import { useState, useEffect, useMemo } from "react";
import type { Exam, ExamRecord, Course, Employee } from "@/lib/types";

export default function AdminResultsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allRecords, setAllRecords] = useState<ExamRecord[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [examsR, coursesR, empR, recordsR] = await Promise.all([
          fetch("/api/exams").then((r) => r.json()),
          fetch("/api/courses").then((r) => r.json()),
          fetch("/api/employees").then((r) => r.json()),
          fetch("/api/records", { method: "PUT" }).then((r) => r.json()),
        ]);
        setExams(examsR.exams || []);
        setCourses(coursesR.courses || []);
        setEmployees(Array.isArray(empR) ? empR : []);
        setAllRecords(recordsR.records || []);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // 获取员工姓名
  const getEmployeeName = (userId: string) => {
    const emp = employees.find((e) => e.employeeId === userId);
    return emp ? emp.name : userId;
  };

  // 获取考试名称
  const getExamTitle = (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    return exam ? exam.title : examId;
  };

  // 筛选后的记录
  const filtered = useMemo(() => {
    let recs = [...allRecords];
    if (selectedExam) {
      recs = recs.filter((r) => r.examId === selectedExam);
    }
    recs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return recs;
  }, [allRecords, selectedExam]);

  // 统计
  const stats = useMemo(() => {
    const uniqueUsers = new Set(allRecords.map((r) => r.userId));
    const passed = allRecords.filter((r) => r.passed);
    return {
      totalAttempts: allRecords.length,
      uniqueUsers: uniqueUsers.size,
      passCount: passed.length,
      passRate: allRecords.length > 0 ? Math.round((passed.length / allRecords.length) * 100) : 0,
      avgScore: allRecords.length > 0
        ? Math.round((allRecords.reduce((s, r) => s + (r.score || 0), 0) / allRecords.length) * 10) / 10
        : 0,
    };
  }, [allRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">成绩查看</h1>
          <p className="text-sm text-gray-500 mt-1">查看员工考试结果和学习进度</p>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          <div className="text-sm text-gray-500">参与人次: {stats.totalAttempts}</div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold">{stats.passRate}%</div>
          <div className="text-sm text-gray-500">通过率 · 均分{stats.avgScore}分</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-600">按考试筛选：</label>
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="rounded-xl border-2 border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-400 bg-white"
        >
          <option value="">全部考试</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>{exam.title}</option>
          ))}
        </select>
      </div>

      {/* 成绩列表 */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold">考试记录</h2>
          <span className="text-xs text-gray-400">共 {filtered.length} 条</span>
        </div>
        <div className="divide-y">
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">
              暂无考试记录
            </div>
          )}
          {filtered.map((rec) => (
            <div key={rec.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{getEmployeeName(rec.userId)}</span>
                  <span className="text-xs text-gray-400">({rec.userId})</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {getExamTitle(rec.examId)} · {new Date(rec.completedAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-semibold">
                  {rec.score}/{rec.total} 分
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    rec.passed
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {rec.passed ? "通过" : "未通过"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
