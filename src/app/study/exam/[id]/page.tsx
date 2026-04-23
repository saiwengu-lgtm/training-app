"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Exam, Question, ExamRecord } from "@/lib/types";

const USER_ID_KEY = "training_user_id";
function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<(number[] | string)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExamRecord | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const userId = getUserId();

  useEffect(() => {
    fetch(`/api/exams/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setExam(d.exam);
        // 初始化答案数组
        if (d.exam) {
          setAnswers(d.exam.questions.map(() => [] as number[]));
        }
      });
  }, [id]);

  function handleSingleAnswer(qIdx: number, optionIdx: number) {
    const newAnswers = [...answers];
    newAnswers[qIdx] = [optionIdx];
    setAnswers(newAnswers);
  }

  function handleMultipleAnswer(qIdx: number, optionIdx: number) {
    const current = (answers[qIdx] || []) as number[];
    const idx = current.indexOf(optionIdx);
    const newVal = idx === -1 ? [...current, optionIdx] : current.filter((v) => v !== optionIdx);
    const newAnswers = [...answers];
    newAnswers[qIdx] = newVal;
    setAnswers(newAnswers);
  }

  function handleJudgeAnswer(qIdx: number, value: number) {
    handleSingleAnswer(qIdx, value);
  }

  function handleEssayAnswer(qIdx: number, text: string) {
    const newAnswers = [...answers];
    newAnswers[qIdx] = text;
    setAnswers(newAnswers);
  }

  async function handleSubmit() {
    if (!exam) return;
    const res = await fetch(`/api/exams/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, answers }),
    });
    const data = await res.json();
    setResult(data.record);
    setSubmitted(true);
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border bg-white p-8 text-center">
            <div className="text-5xl mb-4">{result.passed ? "🎉" : "😅"}</div>
            <h2 className="text-2xl font-bold mb-2">
              {result.passed ? "恭喜通过！" : "未通过"}
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              得分：<span className="font-bold text-2xl">{result.score}</span>
              <span className="text-gray-400"> / {result.total}</span>
            </p>
            {!result.passed && (
              <p className="text-sm text-gray-500 mb-4">
                及格线：{exam.passingScore}分
              </p>
            )}

            {/* 每题得分详情 */}
            <div className="mt-6 space-y-2 text-left">
              {result.detail.map((d, i) => {
                const q = exam.questions[i];
                const typeLabels: Record<string, string> = {
                  single: "单选", multiple: "多选", judge: "判断", essay: "问答",
                };
                return (
                  <div key={d.qId} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm">
                    <span className="truncate flex-1">
                      {i + 1}. {q?.text.slice(0, 30)}...
                      <span className="ml-2 text-xs text-gray-400">[{typeLabels[d.type]}]</span>
                    </span>
                    <span className={`ml-3 font-medium ${d.score >= d.maxScore ? "text-green-600" : "text-red-500"}`}>
                      {d.score}/{d.maxScore}
                    </span>
                  </div>
                );
              })}
            </div>

            <Link
              href="/study"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              返回学习中心
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const q = exam.questions[currentQuestion];
  const typeLabels: Record<string, string> = {
    single: "单选题", multiple: "多选题", judge: "判断题", essay: "问答题",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/study" className="text-sm text-gray-500 hover:text-gray-700">
            ← 返回
          </Link>
          <h1 className="text-lg font-bold">{exam.title}</h1>
          <span className="text-sm text-gray-500">
            {currentQuestion + 1}/{exam.questions.length}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* 进度条 */}
        <div className="mb-6 h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${((currentQuestion + 1) / exam.questions.length) * 100}%` }}
          />
        </div>

        {/* 题目卡片 */}
        <div className="rounded-xl border bg-white p-8">
          <div className="mb-2 text-xs font-medium text-blue-600 uppercase tracking-wide">
            {typeLabels[q.type]} · 第{currentQuestion + 1}题
          </div>
          <h2 className="text-lg font-semibold mb-6">{q.text}</h2>

          {q.type === "single" && (
            <div className="space-y-3">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 transition-colors ${
                    (answers[currentQuestion] as number[])?.[0] === oi
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQuestion}`}
                    checked={(answers[currentQuestion] as number[])?.[0] === oi}
                    onChange={() => handleSingleAnswer(currentQuestion, oi)}
                    className="mr-3"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "multiple" && (
            <div className="space-y-3">
              {q.options.map((opt, oi) => {
                const selected = (answers[currentQuestion] as number[])?.includes(oi);
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 transition-colors ${
                      selected ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => handleMultipleAnswer(currentQuestion, oi)}
                      className="mr-3"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
              <p className="text-xs text-gray-400 mt-2">多选题，少选得部分分，选错不得分</p>
            </div>
          )}

          {q.type === "judge" && (
            <div className="flex gap-4">
              {["正确", "错误"].map((label, oi) => (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-center rounded-lg border px-6 py-4 transition-colors ${
                    (answers[currentQuestion] as number[])?.[0] === oi
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQuestion}`}
                    checked={(answers[currentQuestion] as number[])?.[0] === oi}
                    onChange={() => handleJudgeAnswer(currentQuestion, oi)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "essay" && (
            <div>
              <textarea
                className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="请输入你的回答..."
                value={(answers[currentQuestion] as string) || ""}
                onChange={(e) => handleEssayAnswer(currentQuestion, e.target.value)}
              />
              {q.keywords && q.keywords.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">评分关键词（仅供知晓）：</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {q.keywords.map((kw, ki) => (
                      <span key={ki} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {kw.keyword}（{kw.score}分）
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 导航按钮 */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="rounded-lg border px-6 py-2 text-sm font-medium disabled:opacity-30 hover:bg-gray-100 transition-colors"
          >
            上一题
          </button>

          <span className="text-xs text-gray-400">
            {answers.filter((a) => a.length > 0 || (typeof a === "string" && a)).length}/{exam.questions.length} 题已答
          </span>

          {currentQuestion < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              下一题
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              提交答卷
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
