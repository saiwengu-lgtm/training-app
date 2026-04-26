import type { Course, Exam, ExamRecord, WatchRecord, QuestionBankItem } from "./types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const COURSES_FILE = path.join(DATA_DIR, "courses.json");
const EXAMS_FILE = path.join(DATA_DIR, "exams.json");
const WATCH_FILE = path.join(DATA_DIR, "watch.json");
const EXAM_RECORDS_FILE = path.join(DATA_DIR, "examRecords.json");
export const QUESTIONS_FILE = path.join(DATA_DIR, "questions.json");

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

export function getExamRecords(userId: string): ExamRecord[] {
  return readJSON<ExamRecord[]>(EXAM_RECORDS_FILE, []).filter((r) => r.userId === userId);
}

export function getExamRecord(userId: string, examId: string): ExamRecord | undefined {
  return getExamRecords(userId).find((r) => r.examId === examId);
}

export function addExamRecord(record: ExamRecord): void {
  const records = readJSON<ExamRecord[]>(EXAM_RECORDS_FILE, []);
  records.push(record);
  writeJSON(EXAM_RECORDS_FILE, records);
}

export function getAllExamRecords(): ExamRecord[] {
  return readJSON<ExamRecord[]>(EXAM_RECORDS_FILE, []);
}

export function getLatestExamRecord(userId: string, examId: string): ExamRecord | undefined {
  const records = getExamRecords(userId).filter((r) => r.examId === examId);
  if (records.length === 0) return undefined;
  // 按完成时间降序取最新一条
  records.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  return records[0];
}

export function deleteExamRecord(recordId: string): void {
  const records = readJSON<ExamRecord[]>(EXAM_RECORDS_FILE, []);
  const filtered = records.filter((r) => r.id !== recordId);
  writeJSON(EXAM_RECORDS_FILE, filtered);
}

// ===== 题库 =====
export function getQuestions(): QuestionBankItem[] {
  return readJSON<QuestionBankItem[]>(QUESTIONS_FILE, []);
}

export function getQuestion(id: string): QuestionBankItem | undefined {
  return getQuestions().find((q) => q.id === id);
}

export function addQuestion(q: QuestionBankItem): void {
  const questions = getQuestions();
  questions.push(q);
  writeJSON(QUESTIONS_FILE, questions);
}

export function batchAddQuestions(qs: QuestionBankItem[]): number {
  const questions = getQuestions();
  let added = 0;
  for (const q of qs) {
    if (!questions.find((x) => x.id === q.id)) {
      questions.push(q);
      added++;
    }
  }
  writeJSON(QUESTIONS_FILE, questions);
  return added;
}

export function deleteQuestion(id: string): void {
  const questions = getQuestions().filter((q) => q.id !== id);
  writeJSON(QUESTIONS_FILE, questions);
}

export function clearAllQuestions(): void {
  writeJSON(QUESTIONS_FILE, []);
}

export function getQuestionCategories(): string[] {
  const questions = getQuestions();
  const cats = new Set<string>();
  for (const q of questions) {
    if (q.category) cats.add(q.category);
  }
  return Array.from(cats).sort();
}
