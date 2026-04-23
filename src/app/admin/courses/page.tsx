"use client";

import { useState, useEffect, useRef } from "react";
import type { Course, Exam } from "@/lib/types";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(300);
  const [requiredExamId, setRequiredExamId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadCourses() {
    fetch("/api/courses").then((r) => r.json()).then((d) => setCourses(d.courses));
    fetch("/api/exams").then((r) => r.json()).then((d) => setExams(d.exams));
  }

  useEffect(() => { loadCourses(); }, []);

  function resetForm() {
    setTitle(""); setDescription(""); setVideoFile(null); setVideoUrl("");
    setDuration(300); setRequiredExamId(""); setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(course: Course) {
    setTitle(course.title);
    setDescription(course.description || "");
    setVideoUrl(course.videoUrl);
    setDuration(course.duration);
    setRequiredExamId(course.requiredExamId || "");
    setEditingId(course.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalVideoUrl = videoUrl;

    // 如果有上传文件，转 base64 存到服务器内存
    if (videoFile) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(videoFile);
      });
      finalVideoUrl = base64;
    }

    const body = {
      title,
      description,
      videoUrl: finalVideoUrl,
      duration: Number(duration),
      requiredExamId: requiredExamId || undefined,
    };

    if (editingId) {
      await fetch(`/api/courses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    resetForm();
    setShowForm(false);
    loadCourses();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    loadCourses();
  }

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">课程管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理培训视频课程，支持视频上传</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
        >
          {showForm ? "取消" : "+ 添加课程"}
        </button>
      </div>

      {/* 表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border bg-white p-6 space-y-5 shadow-sm">
          <h2 className="font-semibold text-gray-800">{editingId ? "编辑课程" : "新建课程"}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">课程名称 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入课程名称" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">视频时长（秒）</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">课程描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3} placeholder="课程简介（可选）" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">视频上传</label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <span className="text-lg">📁</span>
                选择视频文件
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setVideoFile(file);
                      setVideoUrl("");
                    }
                  }} />
              </label>
              {videoFile && <span className="text-sm text-green-600">已选择：{videoFile.name}</span>}
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">或输入视频 URL（二选一）</p>
              <input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setVideoFile(null); }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/video.mp4" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">关联考试（看完课程才能参加）</label>
            <select value={requiredExamId} onChange={(e) => setRequiredExamId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">不关联考试</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors shadow-sm">
              {editingId ? "更新课程" : "创建课程"}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              取消
            </button>
          </div>
        </form>
      )}

      {/* 课程列表 */}
      <div className="space-y-4">
        {courses.length === 0 && (
          <div className="rounded-xl border-2 border-dashed bg-white p-16 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-400 font-medium">暂无课程</p>
            <p className="text-gray-300 text-sm mt-1">点击上方"添加课程"开始创建</p>
          </div>
        )}

        {courses.map((course) => {
          const relatedExam = exams.find((e) => e.id === course.requiredExamId);
          const isUploaded = course.videoUrl && course.videoUrl.startsWith("data:");
          return (
            <div key={course.id} className="group rounded-xl border bg-white p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                    {isUploaded && (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">已上传</span>
                    )}
                  </div>
                  {course.description && <p className="mt-1.5 text-sm text-gray-500">{course.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-gray-600">
                      ⏱ {formatDuration(course.duration)}
                    </span>
                    {course.videoUrl && !isUploaded && (
                      <span className="rounded-md bg-blue-50 px-2.5 py-1 text-blue-600">🔗 外部视频</span>
                    )}
                    {!course.videoUrl && (
                      <span className="rounded-md bg-amber-50 px-2.5 py-1 text-amber-600">⚠️ 未设置视频</span>
                    )}
                    {relatedExam && (
                      <span className="rounded-md bg-purple-50 px-2.5 py-1 text-purple-600">
                        📝 关联：{relatedExam.title}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => startEdit(course)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    编辑
                  </button>
                  <button onClick={() => handleDelete(course.id)}
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
