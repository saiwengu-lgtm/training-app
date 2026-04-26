"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, Users, Search, Plus, X } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string;
  employeeId: string;
  browserId?: string;
  createdAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", department: "", employeeId: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  // ===== GBK 编码的 CSV 解析 =====
  const parseCSVFromArrayBuffer = (buffer: ArrayBuffer): string[][] => {
    // 先检测编码：看前几个字节的 BOM
    const raw = new Uint8Array(buffer);
    let encoding = "utf-8";
    let start = 0;
    if (raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF) {
      encoding = "utf-8";
      start = 3;
    } else if (raw[0] === 0xFF && raw[1] === 0xFE) {
      encoding = "utf-16le";
      start = 2;
    } else if (raw[0] === 0xFE && raw[1] === 0xFF) {
      encoding = "utf-16be";
      start = 2;
    } else {
      // 没有 BOM，默认用 GBK（Windows 中文系统默认编码）
      encoding = "gbk";
    }

    let text: string;
    try {
      text = new TextDecoder(encoding, { fatal: false }).decode(
        encoding === "gbk" ? raw : raw.slice(start)
      );
    } catch {
      // fallback
      text = new TextDecoder("gbk", { fatal: false }).decode(raw);
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const rows: string[][] = [];

    for (const line of lines) {
      const parts = parseCSVLine(line);
      if (parts.length >= 2) rows.push(parts);
    }

    return rows;
  };

  // CSV 行解析（处理引号包围的字段）
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === "," || ch === "\t") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const rows = parseCSVFromArrayBuffer(buffer);

      // 跳过表头行（包含"姓名""部门""工号"等关键词的视为表头）
      let startRow = 0;
      if (rows.length > 1) {
        const headerStr = rows[0].join("").toLowerCase();
        if (headerStr.includes("姓名") || headerStr.includes("name") || headerStr.includes("工号") || headerStr.includes("部门")) {
          startRow = 1;
        }
      }

      const employees: any[] = [];
      for (let i = startRow; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length >= 3) {
          employees.push({ name: cols[0], department: cols[1], employeeId: cols[2] });
        } else if (cols.length >= 2) {
          employees.push({ name: cols[0], department: "", employeeId: cols[1] });
        }
      }

      if (employees.length === 0) {
        showMsg("未解析到有效数据，请检查文件格式", "error");
        setUploading(false);
        return;
      }

      try {
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employees),
        });
        const result = await res.json();
        showMsg(`成功导入 ${result.count} 名员工`);
        load();
      } catch {
        showMsg("导入失败", "error");
      }
      setUploading(false);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.employeeId.trim()) {
      showMsg("姓名和工号不能为空", "error");
      return;
    }
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          name: addForm.name.trim(),
          department: addForm.department.trim(),
          employeeId: addForm.employeeId.trim(),
        }]),
      });
      const result = await res.json();
      if (result.success) {
        showMsg(`成功添加员工：${addForm.name}`);
        setAddForm({ name: "", department: "", employeeId: "" });
        setShowAdd(false);
        load();
      } else {
        showMsg(result.error || "添加失败", "error");
      }
    } catch {
      showMsg("添加失败", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除员工「${name}」？`)) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        showMsg(`已删除：${name}`);
        load();
      } else {
        showMsg("删除失败", "error");
      }
    } catch {
      showMsg("删除失败", "error");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("确定清空所有员工数据？此操作不可恢复！")) return;
    await fetch("/api/employees", { method: "DELETE" });
    setEmployees([]);
    showMsg("已清空所有员工");
  };

  const filtered = search
    ? employees.filter((e) => e.name.includes(search) || e.employeeId.includes(search) || e.department.includes(search))
    : employees;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {employees.length} 名员工</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            添加员工
          </button>
          <label className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 cursor-pointer transition-all shadow-sm">
            <Upload className="h-4 w-4" />
            {uploading ? "导入中..." : "导入 Excel"}
            <input
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 rounded-xl border-2 border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            清空
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {msg && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          msgType === "error"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-blue-50 border-blue-200 text-blue-700"
        }`}>
          {msg}
        </div>
      )}

      {/* 添加员工弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">添加员工</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工号 *</label>
                <input
                  type="text"
                  value={addForm.employeeId}
                  onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                  placeholder="请输入工号"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
                <input
                  type="text"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  placeholder="请输入部门（选填）"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full rounded-xl bg-green-600 py-3 text-white font-medium shadow-sm hover:bg-green-500 transition-all"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 搜索 */}
      {employees.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名、工号或部门..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      )}

      {/* 表格 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">暂无员工数据</p>
          <p className="text-sm mt-1">点击「添加员工」或「导入 Excel」</p>
          <p className="text-xs mt-4 text-gray-300">
            Excel 文件格式：姓名, 部门, 工号（支持 GBK/UTF-8 编码）
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="max-h-[calc(100vh-320px)] overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">部门</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">工号</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="w-20 text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.department || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-sm">
                      {emp.browserId ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          已绑定
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          未登录
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
