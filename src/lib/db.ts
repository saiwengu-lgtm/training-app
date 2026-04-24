import type { Course, Exam, WatchRecord, ExamRecord } from "./types";

// PostgreSQL 连接 - 使用 pg 库直连
// 连接字符串从环境变量读取（Vercel 自动注入并解密）
// 如果是 Prisma Postgres，POSTGRES_URL 格式是标准 postgres:// 连接串

let _pool: any = null;

async function getPool() {
  if (_pool) return _pool;

  const connStr =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    "";

  if (!connStr) {
    throw new Error("未找到数据库连接（POSTGRES_URL）");
  }

  const { Pool } = await import("pg");
  _pool = new Pool({ connectionString: connStr });

  // 初始化表
  await _pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      required_exam_id VARCHAR(255) DEFAULT NULL,
      duration INTEGER DEFAULT 300,
      created_at VARCHAR(50) DEFAULT ''
    )
  `);
  await _pool.query(`
    CREATE TABLE IF NOT EXISTS exams (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      passing_score INTEGER DEFAULT 60,
      questions TEXT DEFAULT '[]',
      created_at VARCHAR(50) DEFAULT ''
    )
  `);
  await _pool.query(`
    CREATE TABLE IF NOT EXISTS watch_records (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      course_id VARCHAR(255) NOT NULL,
      progress REAL DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      updated_at VARCHAR(50) DEFAULT ''
    )
  `);
  await _pool.query(`
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
  `);

  return _pool;
}

export async function initDB() {
  await getPool();
}

// ===== 课程 =====
export async function getCourses(): Promise<Course[]> {
  const { rows } = await (await getPool()).query("SELECT * FROM courses ORDER BY created_at DESC");
  return rows.map(mapCourse);
}

export async function getCourse(id: string): Promise<Course | undefined> {
  const { rows } = await (await getPool()).query("SELECT * FROM courses WHERE id = $1", [id]);
  return rows[0] ? mapCourse(rows[0]) : undefined;
}

export async function addCourse(course: Course): Promise<void> {
  await (await getPool()).query(
    "INSERT INTO courses (id,title,description,video_url,required_exam_id,duration,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [course.id, course.title, course.description || "", course.videoUrl || "", course.requiredExamId || null, course.duration, course.createdAt]
  );
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<void> {
  const s: string[] = []; const v: any[] = []; let i = 1;
  if (data.title !== undefined) { s.push(`title=$${i++}`); v.push(data.title); }
  if (data.description !== undefined) { s.push(`description=$${i++}`); v.push(data.description); }
  if (data.videoUrl !== undefined) { s.push(`video_url=$${i++}`); v.push(data.videoUrl); }
  if (data.duration !== undefined) { s.push(`duration=$${i++}`); v.push(data.duration); }
  if (data.requiredExamId !== undefined) { s.push(`required_exam_id=$${i++}`); v.push(data.requiredExamId || null); }
  if (!s.length) return;
  v.push(id);
  await (await getPool()).query(`UPDATE courses SET ${s.join(",")} WHERE id=$${i}`, v);
}

export async function deleteCourse(id: string): Promise<void> {
  await (await getPool()).query("DELETE FROM courses WHERE id=$1", [id]);
}

// ===== 考试 =====
export async function getExams(): Promise<Exam[]> {
  const { rows } = await (await getPool()).query("SELECT * FROM exams ORDER BY created_at DESC");
  return rows.map(mapExam);
}

export async function getExam(id: string): Promise<Exam | undefined> {
  const { rows } = await (await getPool()).query("SELECT * FROM exams WHERE id=$1", [id]);
  return rows[0] ? mapExam(rows[0]) : undefined;
}

export async function addExam(exam: Exam): Promise<void> {
  await (await getPool()).query(
    "INSERT INTO exams (id,title,description,passing_score,questions,created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [exam.id, exam.title, exam.description || "", exam.passingScore, JSON.stringify(exam.questions), exam.createdAt]
  );
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<void> {
  const s: string[] = []; const v: any[] = []; let i = 1;
  if (data.title !== undefined) { s.push(`title=$${i++}`); v.push(data.title); }
  if (data.description !== undefined) { s.push(`description=$${i++}`); v.push(data.description); }
  if (data.passingScore !== undefined) { s.push(`passing_score=$${i++}`); v.push(data.passingScore); }
  if (data.questions !== undefined) { s.push(`questions=$${i++}`); v.push(JSON.stringify(data.questions)); }
  if (!s.length) return;
  v.push(id);
  await (await getPool()).query(`UPDATE exams SET ${s.join(",")} WHERE id=$${i}`, v);
}

export async function deleteExam(id: string): Promise<void> {
  await (await getPool()).query("DELETE FROM exams WHERE id=$1", [id]);
}

// ===== 观看记录 =====
export async function getWatchRecord(userId: string, courseId: string): Promise<WatchRecord | undefined> {
  const { rows } = await (await getPool()).query("SELECT * FROM watch_records WHERE user_id=$1 AND course_id=$2 LIMIT 1", [userId, courseId]);
  return rows[0] ? mapWatch(rows[0]) : undefined;
}

export async function getWatchRecords(userId: string): Promise<WatchRecord[]> {
  const { rows } = await (await getPool()).query("SELECT * FROM watch_records WHERE user_id=$1 ORDER BY updated_at DESC", [userId]);
  return rows.map(mapWatch);
}

export async function upsertWatchRecord(record: WatchRecord): Promise<void> {
  const p = await getPool();
  const { rows } = await p.query("SELECT * FROM watch_records WHERE user_id=$1 AND course_id=$2 LIMIT 1", [record.userId, record.courseId]);
  if (rows.length > 0) {
    const e = rows[0];
    await p.query("UPDATE watch_records SET progress=$1,completed=$2,updated_at=$3 WHERE id=$4",
      [Math.max(e.progress, record.progress), record.completed || e.completed, record.updatedAt, e.id]);
  } else {
    await p.query("INSERT INTO watch_records (id,user_id,course_id,progress,completed,updated_at) VALUES ($1,$2,$3,$4,$5,$6)",
      [record.id, record.userId, record.courseId, record.progress, record.completed, record.updatedAt]);
  }
}

// ===== 考试记录 =====
export async function getExamRecords(userId: string): Promise<ExamRecord[]> {
  const { rows } = await (await getPool()).query("SELECT * FROM exam_records WHERE user_id=$1 ORDER BY completed_at DESC", [userId]);
  return rows.map(mapExamRecord);
}

export async function getAllExamRecords(): Promise<ExamRecord[]> {
  const { rows } = await (await getPool()).query("SELECT * FROM exam_records ORDER BY completed_at DESC");
  return rows.map(mapExamRecord);
}

export async function addExamRecord(record: ExamRecord): Promise<void> {
  await (await getPool()).query(
    "INSERT INTO exam_records (id,user_id,exam_id,answers,score,total,detail,passed,completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [record.id, record.userId, record.examId, JSON.stringify(record.answers), record.score, record.total, JSON.stringify(record.detail), record.passed, record.completedAt]
  );
}

// ===== 映射 =====
function mapCourse(r: any): Course {
  return { id: r.id, title: r.title, description: r.description || "", videoUrl: r.video_url || "", requiredExamId: r.required_exam_id || undefined, duration: r.duration || 300, createdAt: r.created_at || "" };
}
function mapExam(r: any): Exam {
  return { id: r.id, title: r.title, description: r.description || "", passingScore: r.passing_score || 60, questions: JSON.parse(r.questions || "[]"), createdAt: r.created_at || "" };
}
function mapWatch(r: any): WatchRecord {
  return { id: r.id, userId: r.user_id, courseId: r.course_id, progress: r.progress || 0, completed: r.completed || false, updatedAt: r.updated_at || "" };
}
function mapExamRecord(r: any): ExamRecord {
  return { id: r.id, userId: r.user_id, examId: r.exam_id, answers: JSON.parse(r.answers || "[]"), score: r.score || 0, total: r.total || 0, detail: JSON.parse(r.detail || "[]"), passed: r.passed || false, completedAt: r.completed_at || "" };
}
