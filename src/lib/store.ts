// 临时过渡：判断是否在 Vercel 环境，用 Postgres 还是 JSON 文件
// 因为有 @vercel/postgres 环境变量就用 PG，否则用文件

import type { Course, Exam, ExamRecord, WatchRecord } from "./types";

let usePg = false;
try {
  usePg = !!process.env.POSTGRES_URL || !!process.env.POSTGRES_PRISMA_URL;
} catch {}

// 懒加载 db 模块
let db: typeof import("./db") | null = null;
async function getDb() {
  if (!db) {
    db = await import("./db");
    if (usePg) await db.initDB();
  }
  return db;
}

// ===== 课程 =====
export async function getCourses(): Promise<Course[]> {
  if (usePg) return (await getDb()).getCourses();
  return (await import("./fileStore")).getCourses();
}

export async function getCourse(id: string): Promise<Course | undefined> {
  if (usePg) return (await getDb()).getCourse(id);
  return (await import("./fileStore")).getCourse(id);
}

export async function addCourse(course: Course): Promise<void> {
  if (usePg) return (await getDb()).addCourse(course);
  return (await import("./fileStore")).addCourse(course);
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<void> {
  if (usePg) return (await getDb()).updateCourse(id, data);
  return (await import("./fileStore")).updateCourse(id, data);
}

export async function deleteCourse(id: string): Promise<void> {
  if (usePg) return (await getDb()).deleteCourse(id);
  return (await import("./fileStore")).deleteCourse(id);
}

// ===== 考试 =====
export async function getExams(): Promise<Exam[]> {
  if (usePg) return (await getDb()).getExams();
  return (await import("./fileStore")).getExams();
}

export async function getExam(id: string): Promise<Exam | undefined> {
  if (usePg) return (await getDb()).getExam(id);
  return (await import("./fileStore")).getExam(id);
}

export async function addExam(exam: Exam): Promise<void> {
  if (usePg) return (await getDb()).addExam(exam);
  return (await import("./fileStore")).addExam(exam);
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<void> {
  if (usePg) return (await getDb()).updateExam(id, data);
  return (await import("./fileStore")).updateExam(id, data);
}

export async function deleteExam(id: string): Promise<void> {
  if (usePg) return (await getDb()).deleteExam(id);
  return (await import("./fileStore")).deleteExam(id);
}

// ===== 观看记录 =====
export async function getWatchRecord(userId: string, courseId: string): Promise<WatchRecord | undefined> {
  if (usePg) return (await getDb()).getWatchRecord(userId, courseId);
  return (await import("./fileStore")).getWatchRecord(userId, courseId);
}

export async function getWatchRecords(userId: string): Promise<WatchRecord[]> {
  if (usePg) return (await getDb()).getWatchRecords(userId);
  return (await import("./fileStore")).getWatchRecords(userId);
}

export async function upsertWatchRecord(record: WatchRecord): Promise<void> {
  if (usePg) return (await getDb()).upsertWatchRecord(record);
  return (await import("./fileStore")).upsertWatchRecord(record);
}

// ===== 考试记录 =====
export async function getExamRecords(userId: string): Promise<ExamRecord[]> {
  if (usePg) return (await getDb()).getExamRecords(userId);
  return (await import("./fileStore")).getExamRecords(userId);
}

export async function getExamRecord(userId: string, examId: string): Promise<ExamRecord | undefined> {
  if (usePg) {
    const records = await (await getDb()).getExamRecords(userId);
    return records.find((r) => r.examId === examId);
  }
  return (await import("./fileStore")).getExamRecord(userId, examId);
}

export async function addExamRecord(record: ExamRecord): Promise<void> {
  if (usePg) return (await getDb()).addExamRecord(record);
  return (await import("./fileStore")).addExamRecord(record);
}

export async function getAllExamRecords(): Promise<ExamRecord[]> {
  if (usePg) return (await getDb()).getAllExamRecords();
  return (await import("./fileStore")).getAllExamRecords();
}
