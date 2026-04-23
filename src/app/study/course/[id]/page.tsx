"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Course } from "@/lib/types";

const USER_ID_KEY = "training_user_id";

function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export default function CoursePlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState(0);
  const [savedProgress, setSavedProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const userId = getUserId();

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((d) => setCourse(d.course));

    // 获取已有进度
    fetch(`/api/records?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        const w = d.watched?.find((w: any) => w.courseId === id);
        if (w) {
          setSavedProgress(w.progress);
          setProgress(w.progress);
        }
      });
  }, [id]);

  // 每5秒自动保存一次进度
  function saveProgress(p: number) {
    fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId: id, progress: p }),
    }).then((r) => r.json()).then((d) => {
      if (d.record) setSavedProgress(d.record.progress);
    });
  }

  function handleTimeUpdate() {
    if (!videoRef.current || !course?.duration) return;
    const current = videoRef.current.currentTime;
    const p = Math.round((current / course.duration) * 100);
    setProgress(Math.min(100, p));

    // 每10%保存一次，避免频繁请求
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(Math.min(100, p));
    }, 2000);
  }

  function handleVideoEnded() {
    saveProgress(100);
    setProgress(100);
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3">
        <Link href="/study" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← 返回课程列表
        </Link>
        <h1 className="text-sm font-medium text-white">{course.title}</h1>
        <div className="text-xs text-gray-500">
          进度：{Math.round(progress)}%
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* 视频播放器 */}
        <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
          {course.videoUrl ? (
            <video
              ref={videoRef}
              className="h-full w-full"
              src={course.videoUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onLoadedMetadata={() => {
                if (videoRef.current && savedProgress > 0 && course.duration) {
                  videoRef.current.currentTime = (savedProgress / 100) * course.duration;
                }
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              暂无视频文件
            </div>
          )}
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">学习进度</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 课程信息 */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">{course.title}</h2>
          {course.description && (
            <p className="mt-2 text-sm text-gray-500">{course.description}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            {progress >= 100 ? (
              <span className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                ✅ 学习完成
              </span>
            ) : (
              <span className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
                继续观看，完成学习
              </span>
            )}
          </div>

          {progress >= 100 && course.requiredExamId && (
            <Link
              href={`/study/exam/${course.requiredExamId}`}
              className="mt-4 inline-block rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              去考试
            </Link>
          )}
        </div>

        {/* 保存状态 */}
        <p className="mt-3 text-xs text-gray-400 text-center">
          {savedProgress > 0 ? `已保存进度 ${Math.round(savedProgress)}%` : "观看中自动保存进度"}
        </p>
      </div>
    </div>
  );
}
