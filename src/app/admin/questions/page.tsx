"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, Search, Plus, X, BookOpen, Filter, Download } from "lucide-react";

interface QuestionItem {
  id: string;
  category: string;
  type: "single" | "multiple" | "judge" | "essay";
  text: string;
  options: string[];
  correctAnswer: number[];
  score: number;
  tags?: string[];
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  essay: "问答题",
};

const typeColors: Record<string, string> = {
  single: "bg-blue-100 text-blue-700",
  multiple: "bg-purple-100 text-purple-700",
  judge: "bg-green-100 text-green-700",
  essay: "bg-orange-100 text-orange-700",
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  const [newQ, setNewQ] = useState<Partial<QuestionItem>>({
    category: "",
    type: "single",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: [],
    score: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions${filterCat ? "?category=" + encodeURIComponent(filterCat) : ""}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setCategories(data.categories || []);
    } catch {}
    setLoading(false);
  }, [filterCat]);

  useEffect(() => { load(); }, [load]);

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  // ===== Excel 导入 =====
  const parseCSVBuffer = (buffer: ArrayBuffer): string[][] => {
    const raw = new Uint8Array(buffer);
    let encoding = "utf-8";
    let start = 0;
    if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) { start = 3; }
    else if (raw[0] === 0xFF && raw[1] === 0xFE) { encoding = "utf-16le"; start = 2; }
    else if (raw[0] === 0xFE && raw[1] === 0xFF) { encoding = "utf-16be"; start = 2; }
    else { encoding = "gbk"; }
    let text: string;
    try { text = new TextDecoder(encoding).decode(encoding === "gbk" ? raw : raw.slice(start)); }
    catch { text = new TextDecoder("gbk").decode(raw); }
    return text.split(/\r?\n/).filter(l => l.trim()).map(l => {
      const parts: string[] = [];
      let cur = "", inQ = false;
      for (const ch of l) {
        if (inQ) { if (ch === '"') { if (cur.endsWith('"')) cur = cur.slice(0, -1); inQ = false; } else cur += ch; }
        else if (ch === '"') inQ = true;
        else if (ch === ",") { parts.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      parts.push(cur.trim());
      return parts;
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const rows = parseCSVBuffer(buffer);

      // 跳过表头
      let startRow = 0;
      if (rows.length > 1) {
        const h = rows[0].join("").toLowerCase();
        if (h.includes("课题") || h.includes("题型") || h.includes("题目")) startRow = 1;
      }

      const toAdd: any[] = [];
      const errors: string[] = [];

      for (let i = startRow; i < rows.length; i++) {
        const cols = rows[i];
        try {
          const cat = cols[0]?.trim() || "";
          const typeStr = cols[1]?.trim() || "";
          const text = cols[2]?.trim() || "";

          if (!text) { errors.push(`第${i+1}行：题目为空`); continue; }

          let type = "single";
          if (typeStr.includes("多选")) type = "multiple";
          else if (typeStr.includes("判断")) type = "judge";
          else if (typeStr.includes("问答")) type = "essay";

          let options: string[] = [];
          let correctAnswer: number[] = [];

          if (type === "judge") {
            options = ["正确", "错误"];
            const correctStr = cols[3]?.trim() || "";
            correctAnswer = correctStr === "正确" || correctStr === "对" || correctStr === "√" ? [0] : [1];
          } else if (type === "essay") {
            // 问答题不需要选项
            options = [];
            correctAnswer = [];
          } else {
            // 单选/多选：选项A-D 在 cols[3-6]
            const optLabels = ["", "A", "B", "C", "D", "E", "F"];
            for (let j = 3; j <= 6 && j < cols.length; j++) {
              if (cols[j]?.trim()) options.push(cols[j].trim());
            }
            // 正确答案在 cols[7]
            const ansStr = cols[7]?.trim() || "";
            if (type === "single") {
              const idx = optLabels.indexOf(ansStr.toUpperCase());
              correctAnswer = idx >= 1 ? [idx - 1] : [0];
            } else {
              // 多选题答案格式 "AB" 或 "A,B"
              const chars = ansStr.replace(/,/g, "").toUpperCase().split("");
              for (const ch of chars) {
                const idx = optLabels.indexOf(ch);
                if (idx >= 1) correctAnswer.push(idx - 1);
              }
            }
          }

          const score = parseInt(cols[8], 10) || 1;

          toAdd.push({ category: cat, type, text, options, correctAnswer, score, tags: [] });
        } catch {
          errors.push(`第${i+1}行：解析失败`);
        }
      }

      if (toAdd.length === 0) {
        showMsg(`没有有效数据可导入${errors.length ? "（" + errors.join("；") + "）" : ""}`, "error");
        setImporting(false);
        return;
      }

      try {
        const res = await fetch("/api/questions", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toAdd),
        });
        const result = await res.json();
        const errMsg = errors.length ? `，${errors.length}行跳过` : "";
        showMsg(`成功导入 ${result.count} 道题目${errMsg}`);
        load();
      } catch {
        showMsg("导入失败", "error");
      }
      setImporting(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // ===== 手动添加 =====
  const handleAdd = async () => {
    if (!newQ.text?.trim() || !newQ.category?.trim()) {
      showMsg("课题和题目不能为空", "error");
      return;
    }
    try {
      const res = await fetch("/api/questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQ),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("添加成功");
        setShowAdd(false);
        setNewQ({ category: "", type: "single", text: "", options: ["", "", "", ""], correctAnswer: [], score: 1 });
        load();
      }
    } catch {
      showMsg("添加失败", "error");
    }
  };

  // ===== 删除 =====
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showMsg("已删除");
        load();
      }
    } catch {
      showMsg("删除失败", "error");
    }
    setDelConfirm(null);
  };

  const handleClearAll = async () => {
    if (!confirm("确定清空所有题目？此操作不可恢复！")) return;
    await fetch("/api/questions", { method: "DELETE" });
    showMsg("已清空全部题目");
    load();
  };

  // ===== 过滤器 =====
  const filtered = questions.filter((q) => {
    if (search && !q.text.includes(search) && !q.category.includes(search)) return false;
    return true;
  });

  // ===== 导出模板 =====
  const downloadTemplate = () => {
    const header = "课题,题型,题目,选项A,选项B,选项C,选项D,正确答案,分值";
    const sample1 = "安全生产,单选题,以下哪个是灭火器的正确使用方法？,拔掉保险销,对准火焰根部喷射,站在上风口,以上都是,D,2";
    const sample2 = "安全生产,多选题,以下哪些属于个人防护用品？,安全帽,防护眼镜,手套,耳塞,ABCD,2";
    const sample3 = "安全生产,判断题,发生火灾时可以乘坐电梯逃生。,正确,错误,错误,,,2";
    const sample4 = "电气安全,问答题,简述触电急救的基本原则。,,,,,,5";
    const content = [header, sample1, sample2, sample3, sample4].join("\n");
    // GBK 编码
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    const blob = new Blob([bytes], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "试题导入模板.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">题库管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {questions.length} 道题目 | {categories.length} 个课题</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
            <Download className="h-4 w-4" />
            下载模板
          </button>
          <label className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 cursor-pointer transition-all shadow-sm">
            <Upload className="h-4 w-4" />
            {importing ? "导入中..." : "导入 Excel"}
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500 transition-all shadow-sm">
            <Plus className="h-4 w-4" />
            添加题目
          </button>
          <button onClick={handleClearAll} className="flex items-center gap-2 rounded-xl border-2 border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
            <Trash2 className="h-4 w-4" />
            清空
          </button>
        </div>
      </div>

      {/* 消息 */}
      {msg && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${msgType === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
          {msg}
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="搜索题目内容或课题..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="rounded-xl border-2 border-gray-200 pl-10 pr-8 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none bg-white min-w-[140px]">
            <option value="">全部课题</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* 添加题目弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">添加题目</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {/* 课题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课题分类 *</label>
                <div className="flex gap-2">
                  <input type="text" value={newQ.category || ""} onChange={e => setNewQ({ ...newQ, category: e.target.value })}
                    placeholder="输入课题名称（如：安全生产）" list="cat-list"
                    className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400" />
                  <datalist id="cat-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              {/* 题型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">题型</label>
                <select value={newQ.type} onChange={e => {
                  const type = e.target.value as "single" | "multiple" | "judge" | "essay";
                  const opts = type === "judge" ? ["正确", "错误"] : type === "essay" ? [] : ["", "", "", ""];
                  setNewQ({ ...newQ, type, options: opts, correctAnswer: [] });
                }} className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400">
                  <option value="single">单选题</option>
                  <option value="multiple">多选题</option>
                  <option value="judge">判断题</option>
                  <option value="essay">问答题</option>
                </select>
              </div>

              {/* 题目内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">题目 *</label>
                <textarea value={newQ.text || ""} onChange={e => setNewQ({ ...newQ, text: e.target.value })}
                  rows={3} placeholder="请输入题目内容" className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
              </div>

              {/* 选项（非问答题） */}
              {newQ.type !== "essay" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newQ.type === "judge" ? "选项" : "选项（可留空）"}
                  </label>
                  <div className="space-y-2">
                    {(newQ.options || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 text-sm font-medium text-gray-500 text-center">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <input type="text" value={opt} onChange={e => {
                          const opts = [...(newQ.options || [])];
                          opts[i] = e.target.value;
                          setNewQ({ ...newQ, options: opts });
                        }} placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                          className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-400" />
                        {newQ.type !== "judge" && (
                          <button onClick={() => {
                            const opts = [...(newQ.options || [])];
                            opts.splice(i, 1);
                            const ans = (newQ.correctAnswer || []).filter(a => a !== i).map(a => a > i ? a - 1 : a);
                            setNewQ({ ...newQ, options: opts, correctAnswer: ans });
                          }} className="p-1 hover:bg-gray-100 rounded"><X className="h-4 w-4 text-gray-400" /></button>
                        )}
                        {newQ.type !== "judge" && i === (newQ.options?.length || 0) - 1 && (newQ.options?.length || 0) < 6 && (
                          <button onClick={() => setNewQ({ ...newQ, options: [...(newQ.options || []), ""] })}
                            className="text-xs text-blue-500 hover:text-blue-700 whitespace-nowrap">+添加选项</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 正确答案 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">正确答案</label>
                {newQ.type === "essay" ? (
                  <p className="text-sm text-gray-400">问答题由管理员手动批改</p>
                ) : newQ.type === "judge" ? (
                  <select value={(newQ.correctAnswer?.[0] ?? 0).toString()} onChange={e =>
                    setNewQ({ ...newQ, correctAnswer: [parseInt(e.target.value)] })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400">
                    <option value="0">正确</option>
                    <option value="1">错误</option>
                  </select>
                ) : newQ.type === "single" ? (
                  <select value={(newQ.correctAnswer?.[0] ?? 0).toString()} onChange={e =>
                    setNewQ({ ...newQ, correctAnswer: [parseInt(e.target.value)] })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400">
                    {(newQ.options || []).map((opt, i) => (
                      <option key={i} value={i} disabled={!opt}>{String.fromCharCode(65+i)}{opt ? `. ${opt}` : ""}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {(newQ.options || []).map((opt, i) => (
                      <label key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm ${(newQ.correctAnswer || []).includes(i) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="checkbox" checked={(newQ.correctAnswer || []).includes(i)} onChange={() => {
                          const ans = [...(newQ.correctAnswer || [])];
                          const idx = ans.indexOf(i);
                          idx >= 0 ? ans.splice(idx, 1) : ans.push(i);
                          setNewQ({ ...newQ, correctAnswer: ans });
                        }} className="hidden" />
                        {String.fromCharCode(65+i)}. {opt || `选项${String.fromCharCode(65+i)}`}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 分值 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分值</label>
                <input type="number" min={1} max={100} value={newQ.score || 1} onChange={e =>
                  setNewQ({ ...newQ, score: parseInt(e.target.value) || 1 })}
                  className="w-24 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>

              <button onClick={handleAdd} className="w-full rounded-xl bg-green-600 py-3 text-white font-medium hover:bg-green-500 transition-all">
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 题目列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <BookOpen className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">题库为空</p>
          <p className="text-sm mt-1">点击「添加题目」或「导入 Excel」</p>
          <p className="text-xs mt-4 text-gray-300 text-center leading-relaxed max-w-md">
            CSV 格式：课题,题型,题目,选项A,选项B,选项C,选项D,正确答案,分值<br />
            支持 GBK/UTF-8 编码，下载模板查看格式
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 标签行 */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {q.category && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {q.category}
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[q.type] || ""}`}>
                      {typeLabels[q.type] || q.type}
                    </span>
                    <span className="text-xs text-gray-400">{q.score}分</span>
                    {q.tags?.map(t => <span key={t} className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700 border border-yellow-200">{t}</span>)}
                  </div>
                  {/* 题目 */}
                  <p className="text-sm font-medium text-gray-900 mb-2">{q.text}</p>
                  {/* 选项 */}
                  {q.type !== "essay" && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt, i) => (
                        <span key={i} className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs border ${(q.correctAnswer || []).includes(i) ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"}`}>
                          <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                          {(q.correctAnswer || []).includes(i) && <span className="text-green-500">✓</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* 删除 */}
                <div className="shrink-0">
                  {delConfirm === q.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(q.id)} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600">确认</button>
                      <button onClick={() => setDelConfirm(null)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setDelConfirm(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
