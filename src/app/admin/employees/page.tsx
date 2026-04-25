"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, Users, Search } from "lucide-react";

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result as string;
      const lines = data.split("\n").filter((l) => l.trim());
      // 解析 CSV/Excel 数据 - 假设是 tab 或逗号分隔
      const employees: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/\t|,/).map((s) => s.trim().replace(/^"|"$/g, ""));
        if (parts.length >= 3) {
          employees.push({
            name: parts[0],
            department: parts[1],
            employeeId: parts[2],
          });
        } else if (parts.length >= 2) {
          employees.push({
            name: parts[0],
            department: "",
            employeeId: parts.length >= 2 ? parts[1] : "",
          });
        }
      }

      if (employees.length === 0) {
        setMsg("未解析到有效数据，请检查文件格式");
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
        setMsg(`成功导入 ${result.count} 名员工`);
        load();
      } catch {
        setMsg("导入失败");
      }
      setUploading(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearAll = async () => {
    if (!confirm("确定清空所有员工数据？")) return;
    await fetch("/api/employees", { method: "DELETE" });
    setEmployees([]);
    setMsg("已清空所有员工");
  };

  const filtered = search
    ? employees.filter((e) => e.name.includes(search) || e.employeeId.includes(search) || e.department.includes(search))
    : employees;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {employees.length} 名员工
          </p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 cursor-pointer transition-all shadow-sm">
            <Upload className="h-4 w-4" />
            {uploading ? "导入中..." : "上传 Excel"}
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
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

      {msg && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          {msg}
        </div>
      )}

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">暂无员工数据</p>
          <p className="text-sm mt-1">上传 Excel 文件导入员工名单</p>
          <p className="text-xs mt-4 text-gray-300">文件格式：姓名 | 部门 | 工号（支持 .csv .txt .xlsx）</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="max-h-[calc(100vh-280px)] overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">部门</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">工号</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">已绑定设备</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
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
