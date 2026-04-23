"use client";

import { useState, useEffect } from "react";
import type { Exam, Question, QuestionType } from "@/lib/types";

const emptyQuestion = (): Question => ({
  id: Date.now().toString() + Math.random(),
  type: "single",
  score: 1,
  text: "",
  options: ["", "", "", ""],
  correctAnswer: [],
  keywords: [],
  maxScore: 10,
});

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  function loadExams() {
    fetch("/api/exams").then((r) => r.json()).then((d) => setExams(d.exams));
  }

  useEffect(() => { loadExams(); }, []);

  function resetForm() {
    setTitle(""); setDescription(""); setPassingScore(60);
    setQuestions([emptyQuestion()]); setEditingId(null);
  }

  function startEdit(exam: Exam) {
    setTitle(exam.title);
    setDescription(exam.description || "");
    setPassingScore(exam.passingScore);
    setQuestions(exam.questions.map((q) => ({ ...q, score: q.score || 1 })));
    setEditingId(exam.id);
    setShowForm(true);
  }

  function addQuestion() {
    setQuestions([...questions, emptyQuestion()]);
  }

  function removeQuestion(idx: number) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, field: string, value: any) {
    const qs = [...questions];
    (qs[idx] as any)[field] = value;

    if (field === "type") {
      qs[idx].correctAnswer = [];
      if (value === "judge") qs[idx].options = ["正确", "错误"];
      else if (value === "essay") { qs[idx].options = []; qs[idx].maxScore = qs[idx].maxScore || 10; }
      else qs[idx].options = ["", "", "", ""];
    }

    setQuestions(qs);
  }

  function updateOption(idx: number, oi: number, value: string) {
    const qs = [...questions];
    qs[idx].options[oi] = value;
    setQuestions(qs);
  }

  function addOption(idx: number) {
    const qs = [...questions];
    qs[idx].options = [...qs[idx].options, ""];
    setQuestions(qs);
  }

  function removeOption(idx: number, oi: number) {
    const qs = [...questions];
    const opts = qs[idx].options;
    if (opts.length <= 2) return;
    qs[idx].options = opts.filter((_, i) => i !== oi);
    // 调整正确答案索引
    qs[idx].correctAnswer = qs[idx].correctAnswer
      .filter((a) => a !== oi)
      .map((a) => (a > oi ? a - 1 : a));
    setQuestions(qs);
  }

  function toggleCorrectSingle(idx: number, oi: number) {
    const qs = [...questions];
    qs[idx].correctAnswer = [oi];
    setQuestions(qs);
  }

  function toggleCorrectMultiple(idx: number, oi: number) {
    const qs = [...questions];
    const current = qs[idx].correctAnswer;
    const pos = current.indexOf(oi);
    qs[idx].correctAnswer = pos === -1 ? [...current, oi] : current.filter((v) => v !== oi);
    setQuestions(qs);
  }

  function addKeyword(idx: number) {
    const qs = [...questions];
    qs[idx].keywords = [...(qs[idx].keywords || []), { keyword: "", score: 1 }];
    setQuestions(qs);
  }

  function updateKeyword(idx: number, ki: number, field: string, value: any) {
    const qs = [...questions];
    if (qs[idx].keywords) {
      (qs[idx].keywords as any)[ki][field] = value;
    }
    setQuestions(qs);
  }

  function removeKeyword(idx: number, ki: number) {
    const qs = [...questions];
    qs[idx].keywords = (qs[idx].keywords || []).filter((_, i) => i !== ki);
    setQuestions(qs);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 计算总分，同步及格分数线提示
    const totalScore = questions.reduce((s, q) => s + (q.score || 1), 0);

    const body = { title, description, passingScore, questions };

    if (editingId) {
      await fetch(`/api/exams/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    resetForm();
    setShowForm(false);
    loadExams();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    loadExams();
  }

  const typeLabels: Record<QuestionType, string> = {
    single: "单选题", multiple: "多选题", judge: "判断题", essay: "问答题",
  };

  const totalQuestionScore = questions.reduce((s, q) => s + (q.score || 1), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">考试管理</h1>
          <p className="text-sm text-gray-500 mt-1">创建和管理考试，支持多种题型及评分规则</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
        >
          {showForm ? "取消" : "+ 创建考试"}
        </button>
      </div>

      {/* 考试编辑表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border bg-white p-6 space-y-6 shadow-sm">
          <h2 className="font-semibold text-gray-800">{editingId ? "编辑考试" : "新建考试"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">考试名称 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="如：安全知识考核" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                及格分数 *
                <span className="text-gray-400 font-normal ml-1">（总分：{totalQuestionScore}分）</span>
              </label>
              <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">考试说明</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2} placeholder="考试说明（可选）" />
          </div>

          {/* 题目列表 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">题目列表（{questions.length}题，共{totalQuestionScore}分）</span>
              <button type="button" onClick={addQuestion}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium hover:bg-gray-50 transition-colors">
                + 添加题目
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qi) => (
                <div key={q.id} className="rounded-lg border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
                  {/* 题号 + 删除 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {qi + 1}
                      </span>
                      <span className="text-xs text-gray-400">{typeLabels[q.type]}</span>
                    </div>
                    <button type="button" onClick={() => removeQuestion(qi)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">删除</button>
                  </div>

                  {/* 题型选择 */}
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(typeLabels) as [QuestionType, string][]).map(([key, label]) => (
                      <button key={key} type="button"
                        onClick={() => updateQuestion(qi, "type", key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          q.type === key ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 题目文本 + 分值 */}
                  <div className="space-y-2">
                    <input value={q.text} onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入题目内容" required />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">分值：</label>
                      <input type="number" value={q.score} min={1}
                        onChange={(e) => updateQuestion(qi, "score", Math.max(1, Number(e.target.value)))}
                        className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-xs text-gray-400">分</span>
                    </div>
                  </div>

                  {/* 单选题/多选题 - 选项列表 */}
                  {(q.type === "single" || q.type === "multiple") && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2 group">
                          <input type={q.type === "single" ? "radio" : "checkbox"}
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer.includes(oi)}
                            onChange={() => q.type === "single"
                              ? toggleCorrectSingle(qi, oi)
                              : toggleCorrectMultiple(qi, oi)
                            }
                            className="shrink-0"
                          />
                          <input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`选项 ${String.fromCharCode(65 + oi)}`} required />
                          <button type="button" onClick={() => removeOption(qi, oi)}
                            className="invisible group-hover:visible text-xs text-red-400 hover:text-red-600 shrink-0">
                            ✕
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addOption(qi)}
                        className="text-xs text-blue-500 hover:text-blue-700 mt-1">
                        + 添加选项
                      </button>
                    </div>
                  )}

                  {/* 判断题 */}
                  {q.type === "judge" && (
                    <div className="flex gap-4">
                      {["正确", "错误"].map((label, oi) => (
                        <label key={oi}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-3 text-sm transition-colors ${
                            q.correctAnswer[0] === oi ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                          }`}>
                          <input type="radio" name={`judge-${q.id}`}
                            checked={q.correctAnswer[0] === oi}
                            onChange={() => toggleCorrectSingle(qi, oi)} />
                          {label}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* 问答题 */}
                  {q.type === "essay" && (
                    <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-500">最高得分：</label>
                        <input type="number" value={q.maxScore || 10} min={1}
                          onChange={(e) => updateQuestion(qi, "maxScore", Math.max(1, Number(e.target.value)))}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">关键词评分规则</span>
                          <button type="button" onClick={() => addKeyword(qi)}
                            className="text-xs text-blue-600 hover:text-blue-800">+ 添加关键词</button>
                        </div>
                        <div className="space-y-2">
                          {(q.keywords || []).length === 0 && (
                            <p className="text-xs text-gray-400">暂无关键词，添加关键词来自动评分</p>
                          )}
                          {(q.keywords || []).map((kw, ki) => (
                            <div key={ki} className="flex items-center gap-2 group">
                              <input value={kw.keyword}
                                onChange={(e) => updateKeyword(qi, ki, "keyword", e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="关键词" />
                              <span className="text-xs text-gray-400 shrink-0">得</span>
                              <input type="number" value={kw.score} min={0.5} step={0.5}
                                onChange={(e) => updateKeyword(qi, ki, "score", Number(e.target.value))}
                                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              <span className="text-xs text-gray-400 shrink-0">分</span>
                              <button type="button" onClick={() => removeKeyword(qi, ki)}
                                className="invisible group-hover:visible text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 评分规则提示 */}
                  {q.type === "multiple" && (
                    <p className="text-xs text-gray-400">
                      💡 评分：全部选对满分；少选每个正确选项得（{q.score || 1}/{q.correctAnswer.length || 1}分）；选错0分
                    </p>
                  )}
                  {q.type === "single" && <p className="text-xs text-gray-400">💡 评分：选对满分，选错0分</p>}
                  {q.type === "judge" && <p className="text-xs text-gray-400">💡 评分：选对满分，选错0分</p>}
                  {q.type === "essay" && <p className="text-xs text-gray-400">💡 评分：命中关键词得对应分数，最高不超过设定最高分</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors shadow-sm">
              {editingId ? "更新考试" : "创建考试"}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              取消
            </button>
          </div>
        </form>
      )}

      {/* 考试列表 */}
      <div className="space-y-4">
        {exams.length === 0 && (
          <div className="rounded-xl border-2 border-dashed bg-white p-16 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-400 font-medium">暂无考试</p>
            <p className="text-gray-300 text-sm mt-1">点击上方"创建考试"开始创建</p>
          </div>
        )}

        {exams.map((exam) => {
          const typeCount: Record<string, number> = {};
          exam.questions.forEach((q) => {
            typeCount[q.type] = (typeCount[q.type] || 0) + 1;
          });
          const totalScore = exam.questions.reduce((s, q) => s + (q.score || 1), 0);
          return (
            <div key={exam.id} className="group rounded-xl border bg-white p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{exam.title}</h3>
                  {exam.description && <p className="mt-1 text-sm text-gray-500">{exam.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-gray-600">
                      {exam.questions.length}题 · 共{totalScore}分
                    </span>
                    <span className="rounded-md bg-amber-50 px-2.5 py-1 text-amber-600 font-medium">
                      及格线：{exam.passingScore}分
                    </span>
                    {Object.entries(typeCount).map(([type, count]) => (
                      <span key={type} className="rounded-md bg-blue-50 px-2.5 py-1 text-blue-600">
                        {typeLabels[type as QuestionType] || type} {count}题
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => startEdit(exam)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    编辑
                  </button>
                  <button onClick={() => handleDelete(exam.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                    删除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
