"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface QuestionItem {
  id: string;
  type: string;
  text: string;
  options: string[];
  correctAnswer: number[];
  category: string;
  score: number;
}

export default function NewExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [mode, setMode] = useState<"fixed" | "random">("fixed");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [bank, setBank] = useState<QuestionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((d) => setBank(d.questions || []))
      .finally(() => setLoading(false));
  }, []);

  const toggleQuestion = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const addSelected = () => {
    const picked = bank.filter((q) => selectedIds.has(q.id));
    const existing = new Set(questions.map((q) => q.id));
    const newQs = picked.filter((q) => !existing.has(q.id));
    setQuestions([...questions, ...newQs]);
    setSelectedIds(new Set());
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("请输入考试名称");
    if (mode === "fixed" && questions.length === 0) return alert("请选择至少一道题目");

    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        description: description.trim(),
        passingScore,
        mode,
        questions: mode === "fixed" ? questions : [],
      };
      if (mode === "random" && questions.length > 0) {
        // 用选中的题作为随机池的依据
        body.questionSelection = {
          categories: [...new Set(questions.map((q) => q.category))],
          rules: [],
        };
      }
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.exam) {
        router.push("/admin/exams");
      } else {
        alert("创建失败：" + (data.error || "未知错误"));
      }
    } catch (e: any) {
      alert("创建失败：" + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回 */}
      <Link
        href="/admin/exams"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> 返回考试列表
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">创建考试</h1>

      {/* 基本信息 */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            考试名称
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：二级保密资格模拟考试"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            考试说明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="可选的考试说明"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              及格分数
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="w-24 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              出题模式
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fixed">固定题目</option>
              <option value="random">随机抽题</option>
            </select>
          </div>
        </div>
      </div>

      {/* 选题目 */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">从题库选择题目</h2>
          <button
            onClick={addSelected}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            添加选中（{selectedIds.size}题）
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
          {bank.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">题库暂无题目</p>
          ) : (
            bank.map((q) => (
              <label
                key={q.id}
                className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer text-sm hover:bg-gray-50 ${
                  selectedIds.has(q.id) ? "bg-blue-50 ring-1 ring-blue-300" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(q.id)}
                  onChange={() => toggleQuestion(q.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${
                      q.type === "single"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {q.type === "single" ? "单选" : "多选"}
                  </span>
                  <span className="text-gray-800">{q.text}</span>
                  <span className="text-gray-400 text-xs ml-2">[{q.category}]</span>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* 已选题目 */}
      {mode === "fixed" && questions.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            已选题目（{questions.length}题）
          </h2>
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="flex items-start justify-between p-3 rounded-lg bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 mr-2">#{i + 1}</span>
                <span
                  className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${
                    q.type === "single"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {q.type === "single" ? "单选" : "多选"}
                </span>
                <span className="text-sm text-gray-800">{q.text}</span>
              </div>
              <button
                onClick={() => removeQuestion(q.id)}
                className="ml-2 p-1 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {mode === "random" && questions.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            随机抽题范围（{questions.length}题）
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            将从中随机抽取题目组成试卷
          </p>
        </div>
      )}

      {/* 保存 */}
      <div className="flex justify-end gap-3 pb-8">
        <Link
          href="/admin/exams"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          取消
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          创建考试
        </button>
      </div>
    </div>
  );
}
