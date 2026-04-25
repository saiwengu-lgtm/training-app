"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Course, Exam, WatchRecord, ExamRecord } from "@/lib/types";

const USER_ID_KEY = "training_user_id";

function getUserId(): string {
  if (typeof window === "undefined") return "default";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

function getUserName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("user_name") || "";
}

function getUserDept(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("user_department") || "";
}

export default function StudyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [watched, setWatched] = useState<WatchRecord[]>([]);
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [tab, setTab] = useState<"courses" | "exams" | "records">("courses");
  const userId = getUserId();
  const userName = getUserName();
  const userDept = getUserDept();

  function loadData() {
    fetch("/api/courses").then((r) => r.json()).then((d) => setCourses(d.courses));
    fetch("/api/exams").then((r) => r.json()).then((d) => setExams(d.exams));
    fetch(`/api/records?userId=${userId}`).then((r) => r.json()).then((d) => {
      setWatched(d.watched);
      setExamRecords(d.exams);
    });
  }

  useEffect(() => { loadData(); }, []);

  const watchedMap = new Map(watched.map((w) => [w.courseId, w]));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">培训学习平台</h1>
            {userName && (
              <p className="text-xs text-gray-500 mt-0.5">
                {userName} {userDept && `· ${userDept}`}
              </p>
            )}
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">返回首页</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Tab切换 */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm border">
          {[
            { key: "courses", label: "课程学习" },
            { key: "exams", label: "在线考试" },
            { key: "records", label: "学习记录" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 课程列表 */}
        {tab === "courses" && (
          <div className="space-y-4">
            {courses.length === 0 && (
              <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
                暂无课程
              </div>
            )}
            {courses.map((course) => {
              const w = watchedMap.get(course.id);
              const progress = w?.progress || 0;
              return (
                <div key={course.id} className="rounded-xl border bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      {course.description && (
                        <p className="mt-1 text-sm text-gray-500">{course.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/study/course/${course.id}`}
                      className="ml-4 shrink-0 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                      {progress >= 100 ? "重新观看" : "继续学习"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 考试列表 */}
        {tab === "exams" && (
          <div className="space-y-4">
            {exams.length === 0 && (
              <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
                暂无考试
              </div>
            )}
            {exams.map((exam) => {
              const record = examRecords.find((r) => r.examId === exam.id);
              const questionCount = exam.questions.length;
              const types = [...new Set(exam.questions.map((q) => q.type))];
              const typeLabels: Record<string, string> = {
                single: "单选", multiple: "多选", judge: "判断", essay: "问答",
              };

              return (
                <div key={exam.id} className="rounded-xl border bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                      {exam.description && (
                        <p className="mt-1 text-sm text-gray-500">{exam.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {questionCount}题
                        </span>
                        {types.map((t) => (
                          <span key={t} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                            {typeLabels[t]}
                          </span>
                        ))}
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                          及格：{exam.passingScore}分
                        </span>
                      </div>
                      {record && (
                        <div className="mt-2 text-sm">
                          {record.passed ? (
                            <span className="text-green-600 font-medium">
                              已通过 ({record.score}/{record.total}分)
                            </span>
                          ) : (
                            <span className="text-red-500">
                              未通过 ({record.score}/{record.total}分)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Link
                      href={record?.passed ? "#" : `/study/exam/${exam.id}`}
                      className={`ml-4 shrink-0 rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                        record?.passed
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-500"
                      }`}
                      onClick={(e) => { if (record?.passed) e.preventDefault(); }}
                    >
                      {record?.passed ? "已通过" : "开始考试"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 学习记录 */}
        {tab === "records" && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-6">
              <h3 className="font-semibold mb-4">视频学习进度</h3>
              {watched.length === 0 ? (
                <p className="text-sm text-gray-400">暂无观看记录</p>
              ) : (
                <div className="space-y-3">
                  {watched.map((w) => {
                    const course = courses.find((c) => c.id === w.courseId);
                    return (
                      <div key={w.id} className="flex items-center gap-3">
                        <span className="text-sm flex-1">{course?.title || w.courseId}</span>
                        <div className="h-2 w-32 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${w.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">{Math.round(w.progress)}%</span>
                        {w.completed && <span className="text-xs text-green-600 font-medium">已完成</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-6">
              <h3 className="font-semibold mb-4">考试记录</h3>
              {examRecords.length === 0 ? (
                <p className="text-sm text-gray-400">暂无考试记录</p>
              ) : (
                <div className="space-y-3">
                  {examRecords.map((r) => {
                    const exam = exams.find((e) => e.id === r.examId);
                    return (
                      <div key={r.id} className="flex items-center justify-between">
                        <span className="text-sm">{exam?.title || r.examId}</span>
                        <span className={`text-sm font-medium ${r.passed ? "text-green-600" : "text-red-500"}`}>
                          {r.score}/{r.total}分 {r.passed ? "✅" : "❌"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
