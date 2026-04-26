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

// 预定义题型
const QUESTION_TYPES = [
  { value: "single", label: "单选题" },
  { value: "multiple", label: "多选题" },
  { value: "judge", label: "判断题" },
];

export default function NewExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [mode, setMode] = useState<"fixed" | "random">("random");
  const [selectedCategory, setSelectedCategory] = useState("");

  // 随机模式的题型规则
  const [rules, setRules] = useState([
    { type: "single", count: 10, score: 1 },
    { type: "multiple", count: 5, score: 2 },
    { type: "judge", count: 5, score: 1 },
  ]);

  // 固定模式选题
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [bank, setBank] = useState<QuestionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((d) => {
        setBank(d.questions || []);
        setCategories(d.categories || []);
        if (d.categories?.length > 0) setSelectedCategory(d.categories[0]);
      })
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

  const updateRule = (index: number, field: string, value: number) => {
    const newRules = [...rules];
    (newRules[index] as any)[field] = value;
    setRules(newRules);
  };

  const totalScore = rules.reduce((sum, r) => sum + r.count * r.score, 0);

  const handleSave = async () => {
    if (!title.trim()) return alert("请输入考试名称");
    if (mode === "random" && rules.every((r) => r.count === 0)) return alert("请至少设置一个题型");
    if (mode === "fixed" && questions.length === 0) return alert("请选择至少一道题目");

    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        description: description.trim(),
        passingScore,
        mode,
      };

      if (mode === "random") {
        body.questionSelection = {
          categories: selectedCategory ? [selectedCategory] : [],
          rules: rules.filter((r) => r.count > 0).map((r) => ({ type: r.type, count: r.count, score: r.score })),
        };
        body.questions = [];
      } else {
        body.questions = questions;
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

  const filteredBank = selectedCategory
    ? bank.filter((q) => q.category === selectedCategory)
    : bank;

  const bankByType = (type: string) => bank.filter((q) => q.type === type);
  const catByType = (type: string) => bank.filter((q) => q.type === type && (selectedCategory ? q.category === selectedCategory : true));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/exams" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> 返回考试列表
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">创建考试</h1>

      {/* 基本信息 */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">考试名称</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：二级保密资格模拟考试"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">考试说明</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} placeholder="可选的考试说明"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">及格分数</label>
            <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))}
              className="w-24 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出题模式</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as any)}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="random">随机抽题（推荐）</option>
              <option value="fixed">固定题目</option>
            </select>
          </div>
        </div>
      </div>

      {/* 随机模式：设置各题型数量 */}
      {mode === "random" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">随机抽题设置</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选题分类</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              题库中该分类共：{bankByType("single").filter(q => q.category === selectedCategory).length}题单选 / {bankByType("multiple").filter(q => q.category === selectedCategory).length}题多选 / {bankByType("judge").filter(q => q.category === selectedCategory).length}题判断
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 px-2">
              <div className="col-span-4">题型</div>
              <div className="col-span-3 text-center">抽题数</div>
              <div className="col-span-3 text-center">每题分值</div>
              <div className="col-span-2 text-right">小计</div>
            </div>

            {rules.map((rule, i) => {
              const typeLabel = QUESTION_TYPES.find((t) => t.value === rule.type)?.label || rule.type;
              const available = catByType(rule.type).length;
              return (
                <div key={rule.type} className="grid grid-cols-12 gap-3 items-center rounded-lg bg-gray-50 px-3 py-3">
                  <div className="col-span-4">
                    <span className="text-sm font-medium">{typeLabel}</span>
                    <span className="text-xs text-gray-400 ml-2">题库有{available}题</span>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <input type="number" min={0} max={available}
                      value={rule.count} onChange={(e) => updateRule(i, "count", Math.max(0, Math.min(available, Number(e.target.value))))}
                      className="w-16 rounded border px-2 py-1 text-sm text-center" />
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <input type="number" min={0} max={10}
                      value={rule.score} onChange={(e) => updateRule(i, "score", Math.max(0, Number(e.target.value)))}
                      className="w-16 rounded border px-2 py-1 text-sm text-center" />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium text-gray-600">
                    {rule.count * rule.score}分
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <p className="text-sm text-gray-500">
              员工每次进入考试，系统将从题库中随机抽题
            </p>
            <p className="text-sm font-bold text-blue-600">
              试卷总分：{totalScore}分
            </p>
          </div>
        </div>
      )}

      {/* 固定模式：从题库选题 */}
      {mode === "fixed" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">从题库选择题目</h2>
            <button onClick={addSelected} disabled={selectedIds.size === 0}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              <Plus className="h-3 w-3" />
              添加选中（{selectedIds.size}题）
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                className={`text-xs px-3 py-1 rounded-full ${selectedCategory === c ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
            {filteredBank.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">该分类暂无题目</p>
            ) : (
              filteredBank.map((q) => (
                <label key={q.id}
                  className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer text-sm hover:bg-gray-50 ${selectedIds.has(q.id) ? "bg-blue-50 ring-1 ring-blue-300" : ""}`}>
                  <input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => toggleQuestion(q.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${q.type === "single" ? "bg-blue-100 text-blue-700" : q.type === "multiple" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                      {q.type === "single" ? "单选" : q.type === "multiple" ? "多选" : "判断"}
                    </span>
                    <span className="text-gray-800">{q.text}</span>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* 已选题目 */}
      {mode === "fixed" && questions.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">已选题目（{questions.length}题）</h2>
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 mr-2">#{i + 1}</span>
                <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${q.type === "single" ? "bg-blue-100 text-blue-700" : q.type === "multiple" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                  {q.type === "single" ? "单选" : q.type === "multiple" ? "多选" : "判断"}
                </span>
                <span className="text-sm text-gray-800">{q.text}</span>
              </div>
              <button onClick={() => removeQuestion(q.id)} className="ml-2 p-1 text-red-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 保存 */}
      <div className="flex justify-end gap-3 pb-8">
        <Link href="/admin/exams" className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">取消</Link>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          创建考试
        </button>
      </div>
    </div>
  );
}
