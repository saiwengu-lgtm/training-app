"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Exam, Question, ExamRecord } from "@/lib/types";

const USER_ID_KEY = "training_user_id";
const SNAPSHOT_KEY = "exam_snapshot_";

function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

const typeLabels: Record<string, string> = {
  single: "单选题", multiple: "多选题", judge: "判断题", essay: "问答题",
};

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number[] | string)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExamRecord | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pageError, setPageError] = useState<string>("");
  const initialized = useRef(false);
  const userId = getUserId();

  useEffect(() => {
    doInit().catch((e: any) => {
      setPageError("初始化错误: " + (e?.message || String(e)));
      setLoading(false);
    });
  }, [id]);

  async function doInit() {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const resp = await fetch(`/api/exams/${id}`);
      const d = await resp.json();
      const examData = d.exam as Exam;
      if (!examData) {
        setPageError("考试不存在或加载失败");
        setLoading(false);
        return;
      }
      setExam(examData);

      let finalQuestions: Question[];

      if (examData.mode === "random") {
        setGenerating(true);
        const cached = localStorage.getItem(SNAPSHOT_KEY + id);
        if (cached) {
          try {
            finalQuestions = JSON.parse(cached);
          } catch {
            finalQuestions = await generateOnServer(id);
          }
        } else {
          finalQuestions = await generateOnServer(id);
        }
        if (finalQuestions && finalQuestions.length > 0) {
          localStorage.setItem(SNAPSHOT_KEY + id, JSON.stringify(finalQuestions));
        }
        setGenerating(false);
      } else {
        finalQuestions = examData.questions || [];
      }

      if (!finalQuestions || finalQuestions.length === 0) {
        setPageError("没有可供考试的题目。请检查题库是否存在以及考试出题规则是否正确。");
        setLoading(false);
        return;
      }

      setQuestions(finalQuestions);
      setAnswers(finalQuestions.map(() => [] as number[]));
      setLoading(false);
    } catch (e: any) {
      setPageError("加载考试失败: " + (e?.message || String(e)));
      setLoading(false);
    }
  }

  async function generateOnServer(examId: string): Promise<Question[]> {
    const resp = await fetch(`/api/exams/${examId}/generate`, { method: "POST" });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error("后端抽题失败: " + err.slice(0, 200));
    }
    const data = await resp.json();
    if (!data.questions || data.questions.length === 0) {
      throw new Error("后端未生成任何题目");
    }
    return data.questions;
  }

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
    setGenerating(true);
    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, answers, snapshotQuestions: questions }),
      });
      const data = await res.json();
      setResult(data.record);
      setSubmitted(true);
      localStorage.removeItem(SNAPSHOT_KEY + id);
    } catch (e: any) {
      alert("提交失败：" + e.message);
    } finally {
      setGenerating(false);
    }
  }

  // ---- Error page ----
  if (pageError) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:p-8">
        <div className="mx-auto max-w-xl rounded-xl border bg-white px-4 py-6 sm:p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-red-600 mb-2">页面加载错误</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{pageError}</p>
          <Link href="/study" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">返回学习中心</Link>
        </div>
      </div>
    );
  }

  // ---- Loading ----
  if (loading || generating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-gray-400">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-sm">{generating ? "正在生成试卷..." : "加载中..."}</p>
      </div>
    );
  }

  if (!exam) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">考试不存在</div>;
  }

  // ---- Result ----
  if (submitted && result) {
    const q = questions[currentQuestion];
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border bg-white px-4 py-6 sm:p-8 text-center">
            <div className="text-5xl mb-4">{result.passed ? "🎉" : "😅"}</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{result.passed ? "恭喜通过！" : "未通过"}</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-2">
              得分：<span className="font-bold text-xl sm:text-2xl">{result.score}</span>
              <span className="text-gray-400"> / {result.total}</span>
            </p>
            {!result.passed && <p className="text-sm text-gray-500 mb-4">及格线：{exam.passingScore}分</p>}
            <div className="mt-6 space-y-2 text-left">
              {result.detail.map((d, i) => {
                const q = questions[i];
                return (
                  <div key={d.qId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 sm:px-4 py-2 text-xs sm:text-sm">
                    <span className="flex-1 break-words pr-2">
                      {i + 1}. {q?.text?.slice(0, 30)}...
                      <span className="ml-1 text-xs text-gray-400">[{typeLabels[d.type]}]</span>
                    </span>
                    <span className={`ml-2 shrink-0 font-medium ${d.score >= d.maxScore ? "text-green-600" : "text-red-500"}`}>
                      {d.score}/{d.maxScore}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link href="/study" className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500">返回学习中心</Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Index error ----
  const q = questions[currentQuestion];
  if (!q) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:p-8">
        <div className="mx-auto max-w-xl rounded-xl border bg-white px-4 py-6 sm:p-8 text-center">
          <h2 className="font-bold text-red-600">题目索引错误</h2>
          <p className="text-sm text-gray-500">当前题目不存在 (索引: {currentQuestion}, 共 {questions.length} 题)</p>
          <Link href="/study" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">返回学习中心</Link>
        </div>
      </div>
    );
  }

  // ---- Main exam ----
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-4 sm:px-6 py-3 sm:py-4 shrink-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/study" className="text-xs sm:text-sm text-gray-500 hover:text-gray-700">← 返回</Link>
          <h1 className="text-sm sm:text-lg font-bold truncate mx-2">{exam.title}</h1>
          <span className="text-xs sm:text-sm text-gray-500 shrink-0">{currentQuestion + 1}/{questions.length}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 flex-1 flex flex-col">
        <div className="rounded-xl border bg-white px-4 sm:p-8 py-5 flex-1">
          <div className="mb-2 text-xs font-medium text-blue-600 uppercase tracking-wide">
            {typeLabels[q.type]} · 第{currentQuestion + 1}题
          </div>
          <h2 className="text-base sm:text-lg font-semibold mb-5 leading-relaxed">{q.text}</h2>

          {q.type === "single" && (
            <div className="space-y-2 sm:space-y-3">
              {(q.options || []).map((opt, oi) => (
                <label key={oi}
                  className={`flex cursor-pointer items-center rounded-lg border px-3 sm:px-4 py-3 sm:py-3 transition-colors text-sm sm:text-base ${(answers[currentQuestion] as number[])?.[0] === oi ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                  <input type="radio" name={`q-${currentQuestion}`}
                    checked={(answers[currentQuestion] as number[])?.[0] === oi}
                    onChange={() => handleSingleAnswer(currentQuestion, oi)} className="mr-3 shrink-0" />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "multiple" && (
            <div className="space-y-2 sm:space-y-3">
              {(q.options || []).map((opt, oi) => (
                <label key={oi}
                  className={`flex cursor-pointer items-center rounded-lg border px-3 sm:px-4 py-3 sm:py-3 transition-colors text-sm sm:text-base ${(answers[currentQuestion] as number[])?.includes(oi) ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                  <input type="checkbox" checked={!!(answers[currentQuestion] as number[])?.includes(oi)}
                    onChange={() => handleMultipleAnswer(currentQuestion, oi)} className="mr-3 shrink-0" />
                  <span>{opt}</span>
                </label>
              ))}
              <p className="text-xs text-gray-400 mt-2">多选题，少选得部分分，选错不得分</p>
            </div>
          )}

          {q.type === "judge" && (
            <div className="flex gap-3 sm:gap-4">
              {["正确", "错误"].map((label, oi) => (
                <label key={oi}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 sm:px-6 py-4 transition-colors ${(answers[currentQuestion] as number[])?.[0] === oi ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
                  <input type="radio" name={`q-${currentQuestion}`}
                    checked={(answers[currentQuestion] as number[])?.[0] === oi}
                    onChange={() => handleJudgeAnswer(currentQuestion, oi)} className="mr-2" />
                  <span className="text-sm sm:text-base font-medium">{label}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "essay" && (
            <textarea className="w-full rounded-lg border px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6} placeholder="请输入你的回答..."
              value={(answers[currentQuestion] as string) || ""}
              onChange={(e) => handleEssayAnswer(currentQuestion, e.target.value)} />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-4 sm:mt-6 mb-6 flex items-center justify-between shrink-0">
          <button onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="rounded-lg border px-4 sm:px-6 py-2 text-sm font-medium disabled:opacity-30 hover:bg-gray-100 transition-colors">上一题</button>
          <span className="text-xs text-gray-400">
            {answers.filter((a) => a.length > 0 || (typeof a === "string" && a)).length}/{questions.length} 题已答
          </span>
          {currentQuestion < questions.length - 1 ? (
            <button onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="rounded-lg bg-blue-600 px-4 sm:px-6 py-2 text-sm font-medium text-white hover:bg-blue-500">下一题</button>
          ) : (
            <button onClick={handleSubmit}
              className="rounded-lg bg-green-600 px-6 sm:px-8 py-2 text-sm font-medium text-white hover:bg-green-500">提交答卷</button>
          )}
        </div>
      </div>
    </div>
  );
}
