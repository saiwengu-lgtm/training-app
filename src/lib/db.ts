import { sql } from "@vercel/postgres";
import type { Course, Exam, WatchRecord, ExamRecord } from "./types";

// ===== 初始化表 =====
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      required_exam_id VARCHAR(255) DEFAULT NULL,
      duration INTEGER DEFAULT 300,
      created_at VARCHAR(50) DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS exams (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      passing_score INTEGER DEFAULT 60,
      questions TEXT DEFAULT '[]',
      created_at VARCHAR(50) DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS watch_records (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      course_id VARCHAR(255) NOT NULL,
      progress REAL DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      updated_at VARCHAR(50) DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS exam_records (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      exam_id VARCHAR(255) NOT NULL,
      answers TEXT DEFAULT '[]',
      score REAL DEFAULT 0,
      total REAL DEFAULT 0,
      detail TEXT DEFAULT '[]',
      passed BOOLEAN DEFAULT FALSE,
      completed_at VARCHAR(50) DEFAULT ''
    )
  `;
}

// ===== 课程 =====
export async function getCourses(): Promise<Course[]> {
  const { rows } = await sql`SELECT * FROM courses ORDER BY created_at DESC`;
  return rows.map(mapCourse);
}

export async function getCourse(id: string): Promise<Course | undefined> {
  const { rows } = await sql`SELECT * FROM courses WHERE id = ${id}`;
  return rows.length > 0 ? mapCourse(rows[0]) : undefined;
}

export async function addCourse(course: Course): Promise<void> {
  await sql`
    INSERT INTO courses (id, title, description, video_url, required_exam_id, duration, created_at)
    VALUES (${course.id}, ${course.title}, ${course.description || ""}, ${course.videoUrl || ""}, ${course.requiredExamId || null}, ${course.duration}, ${course.createdAt})
  `;
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<void> {
  const sets: string[] = [];
  const vals: any[] = [];
  if (data.title !== undefined) { sets.push(`title = $${vals.length + 1}`); vals.push(data.title); }
  if (data.description !== undefined) { sets.push(`description = $${vals.length + 1}`); vals.push(data.description); }
  if (data.videoUrl !== undefined) { sets.push(`video_url = $${vals.length + 1}`); vals.push(data.videoUrl); }
  if (data.duration !== undefined) { sets.push(`duration = $${vals.length + 1}`); vals.push(data.duration); }
  if (data.requiredExamId !== undefined) { sets.push(`required_exam_id = $${vals.length + 1}`); vals.push(data.requiredExamId || null); }
  if (sets.length === 0) return;
  vals.push(id);
  await sql.query(`UPDATE courses SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
}

export async function deleteCourse(id: string): Promise<void> {
  await sql`DELETE FROM courses WHERE id = ${id}`;
}

// ===== 考试 =====
export async function getExams(): Promise<Exam[]> {
  const { rows } = await sql`SELECT * FROM exams ORDER BY created_at DESC`;
  return rows.map(mapExam);
}

export async function getExam(id: string): Promise<Exam | undefined> {
  const { rows } = await sql`SELECT * FROM exams WHERE id = ${id}`;
  return rows.length > 0 ? mapExam(rows[0]) : undefined;
}

export async function addExam(exam: Exam): Promise<void> {
  await sql`
    INSERT INTO exams (id, title, description, passing_score, questions, created_at)
    VALUES (${exam.id}, ${exam.title}, ${exam.description || ""}, ${exam.passingScore}, ${JSON.stringify(exam.questions)}, ${exam.createdAt})
  `;
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<void> {
  const sets: string[] = [];
  const vals: any[] = [];
  if (data.title !== undefined) { sets.push(`title = $${vals.length + 1}`); vals.push(data.title); }
  if (data.description !== undefined) { sets.push(`description = $${vals.length + 1}`); vals.push(data.description); }
  if (data.passingScore !== undefined) { sets.push(`passing_score = $${vals.length + 1}`); vals.push(data.passingScore); }
  if (data.questions !== undefined) { sets.push(`questions = $${vals.length + 1}`); vals.push(JSON.stringify(data.questions)); }
  if (sets.length === 0) return;
  vals.push(id);
  await sql.query(`UPDATE exams SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
}

export async function deleteExam(id: string): Promise<void> {
  await sql`DELETE FROM exams WHERE id = ${id}`;
}

// ===== 观看记录 =====
export async function getWatchRecord(userId: string, courseId: string): Promise<WatchRecord | undefined> {
  const { rows } = await sql`SELECT * FROM watch_records WHERE user_id = ${userId} AND course_id = ${courseId} LIMIT 1`;
  return rows.length > 0 ? mapWatch(rows[0]) : undefined;
}

export async function getWatchRecords(userId: string): Promise<WatchRecord[]> {
  const { rows } = await sql`SELECT * FROM watch_records WHERE user_id = ${userId} ORDER BY updated_at DESC`;
  return rows.map(mapWatch);
}

export async function upsertWatchRecord(record: WatchRecord): Promise<void> {
  const { rows } = await sql`
    SELECT * FROM watch_records WHERE user_id = ${record.userId} AND course_id = ${record.courseId} LIMIT 1
  `;
  if (rows.length > 0) {
    const existing = rows[0];
    const newProgress = Math.max(existing.progress, record.progress);
    await sql`
      UPDATE watch_records SET progress = ${newProgress}, completed = ${record.completed || existing.completed}, updated_at = ${record.updatedAt}
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      INSERT INTO watch_records (id, user_id, course_id, progress, completed, updated_at)
      VALUES (${record.id}, ${record.userId}, ${record.courseId}, ${record.progress}, ${record.completed}, ${record.updatedAt})
    `;
  }
}

// ===== 考试记录 =====
export async function getExamRecords(userId: string): Promise<ExamRecord[]> {
  const { rows } = await sql`SELECT * FROM exam_records WHERE user_id = ${userId} ORDER BY completed_at DESC`;
  return rows.map(mapExamRecord);
}

export async function getAllExamRecords(): Promise<ExamRecord[]> {
  const { rows } = await sql`SELECT * FROM exam_records ORDER BY completed_at DESC`;
  return rows.map(mapExamRecord);
}

export async function addExamRecord(record: ExamRecord): Promise<void> {
  await sql`
    INSERT INTO exam_records (id, user_id, exam_id, answers, score, total, detail, passed, completed_at)
    VALUES (${record.id}, ${record.userId}, ${record.examId}, ${JSON.stringify(record.answers)}, ${record.score}, ${record.total}, ${JSON.stringify(record.detail)}, ${record.passed}, ${record.completedAt})
  `;
}

// ===== 映射 =====
function mapCourse(row: any): Course {
  return { id: row.id, title: row.title, description: row.description || "", videoUrl: row.video_url || "", requiredExamId: row.required_exam_id || undefined, duration: row.duration || 300, createdAt: row.created_at || "" };
}

function mapExam(row: any): Exam {
  return { id: row.id, title: row.title, description: row.description || "", passingScore: row.passing_score || 60, questions: JSON.parse(row.questions || "[]"), createdAt: row.created_at || "" };
}

function mapWatch(row: any): WatchRecord {
  return { id: row.id, userId: row.user_id, courseId: row.course_id, progress: row.progress || 0, completed: row.completed || false, updatedAt: row.updated_at || "" };
}

function mapExamRecord(row: any): ExamRecord {
  return { id: row.id, userId: row.user_id, examId: row.exam_id, answers: JSON.parse(row.answers || "[]"), score: row.score || 0, total: row.total || 0, detail: JSON.parse(row.detail || "[]"), passed: row.passed || false, completedAt: row.completed_at || "" };
}
