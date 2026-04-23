import type { Course, Exam, ExamRecord, WatchRecord } from "./types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const COURSES_FILE = path.join(DATA_DIR, "courses.json");
const EXAMS_FILE = path.join(DATA_DIR, "exams.json");
const WATCH_FILE = path.join(DATA_DIR, "watch.json");
const EXAM_RECORDS_FILE = path.join(DATA_DIR, "examRecords.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(file: string, fallback: T): T {
  ensureDir();
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch {}
  return fallback;
}

function writeJSON(file: string, data: any) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// ===== 课程 =====
export function getCourses(): Course[] {
  return readJSON<Course[]>(COURSES_FILE, []);
}

export function getCourse(id: string): Course | undefined {
  return getCourses().find((c) => c.id === id);
}

export function addCourse(course: Course): void {
  const courses = getCourses();
  courses.push(course);
  writeJSON(COURSES_FILE, courses);
}

export function updateCourse(id: string, data: Partial<Course>): void {
  const courses = getCourses();
  const idx = courses.findIndex((c) => c.id === id);
  if (idx !== -1) {
    courses[idx] = { ...courses[idx], ...data };
    writeJSON(COURSES_FILE, courses);
  }
}

export function deleteCourse(id: string): void {
  const courses = getCourses().filter((c) => c.id !== id);
  writeJSON(COURSES_FILE, courses);
}

// ===== 考试 =====
export function getExams(): Exam[] {
  return readJSON<Exam[]>(EXAMS_FILE, []);
}

export function getExam(id: string): Exam | undefined {
  return getExams().find((e) => e.id === id);
}

export function addExam(exam: Exam): void {
  const exams = getExams();
  exams.push(exam);
  writeJSON(EXAMS_FILE, exams);
}

export function updateExam(id: string, data: Partial<Exam>): void {
  const exams = getExams();
  const idx = exams.findIndex((e) => e.id === id);
  if (idx !== -1) {
    exams[idx] = { ...exams[idx], ...data };
    writeJSON(EXAMS_FILE, exams);
  }
}

export function deleteExam(id: string): void {
  const exams = getExams().filter((e) => e.id !== id);
  writeJSON(EXAMS_FILE, exams);
}

// ===== 观看记录 =====
export function getWatchRecord(userId: string, courseId: string): WatchRecord | undefined {
  return getWatchRecords(userId).find((r) => r.courseId === courseId);
}

export function getWatchRecords(userId: string): WatchRecord[] {
  return readJSON<WatchRecord[]>(WATCH_FILE, []).filter((r) => r.userId === userId);
}

export function upsertWatchRecord(record: WatchRecord): void {
  const records = readJSON<WatchRecord[]>(WATCH_FILE, []);
  const idx = records.findIndex(
    (r) => r.userId === record.userId && r.courseId === record.courseId
  );
  if (idx !== -1) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  writeJSON(WATCH_FILE, records);
}

// ===== 考试记录 =====
export function getExamRecords(userId: string): ExamRecord[] {
  return readJSON<ExamRecord[]>(EXAM_RECORDS_FILE, []).filter((r) => r.userId === userId);
}

export function addExamRecord(record: ExamRecord): void {
  const records = readJSON<ExamRecord[]>(EXAM_RECORDS_FILE, []);
  records.push(record);
  writeJSON(EXAM_RECORDS_FILE, records);
}

export function getAllExamRecords(): ExamRecord[] {
  return readJSON<ExamRecord[]>(EXAM_RECORDS_FILE, []);
}
