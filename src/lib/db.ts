import type { Course, Exam, WatchRecord, ExamRecord, Employee, QuestionBankItem } from "./types";
import * as fileStore from "./fileStore";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const EMPLOYEES_FILE = path.join(DATA_DIR, "employees.json");

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

// ===== 检测是否有 Postgres 连接 =====
function hasPostgres(): boolean {
  const connStr =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    "";
  return !!connStr;
}

// ===== 尝试初始化 DB，失败则 fallback 到文件存储 =====
let _pool: any = null;
let _useFile = false;

async function getPool() {
  if (_pool) return _pool;
  if (_useFile) throw new Error("using file store");
  if (!hasPostgres()) {
    _useFile = true;
    throw new Error("using file store");
  }
  try {
    const connStr =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      "";
    const { Pool } = await import("pg");
    _pool = new Pool({ connectionString: connStr });
    await initTables();
    return _pool;
  } catch (e) {
    _useFile = true;
    throw new Error("using file store");
  }
}

async function initTables() {
  if (!_pool) return;
  await _pool.query(`CREATE TABLE IF NOT EXISTS courses (id VARCHAR(255) PRIMARY KEY,title VARCHAR(500) NOT NULL,description TEXT DEFAULT '',video_url TEXT DEFAULT '',required_exam_id VARCHAR(255) DEFAULT NULL,duration INTEGER DEFAULT 300,created_at VARCHAR(50) DEFAULT '')`);
  await _pool.query(`CREATE TABLE IF NOT EXISTS exams (id VARCHAR(255) PRIMARY KEY,title VARCHAR(500) NOT NULL,description TEXT DEFAULT '',passing_score INTEGER DEFAULT 60,mode VARCHAR(50) DEFAULT 'fixed',question_selection TEXT DEFAULT NULL,questions TEXT DEFAULT '[]',created_at VARCHAR(50) DEFAULT '')`);
  try { await _pool.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'fixed'`); } catch {}
  try { await _pool.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS question_selection TEXT DEFAULT NULL`); } catch {}
  await _pool.query(`CREATE TABLE IF NOT EXISTS watch_records (id VARCHAR(255) PRIMARY KEY,user_id VARCHAR(255) NOT NULL,course_id VARCHAR(255) NOT NULL,progress REAL DEFAULT 0,completed BOOLEAN DEFAULT FALSE,updated_at VARCHAR(50) DEFAULT '')`);
  await _pool.query(`CREATE TABLE IF NOT EXISTS exam_records (id VARCHAR(255) PRIMARY KEY,user_id VARCHAR(255) NOT NULL,exam_id VARCHAR(255) NOT NULL,answers TEXT DEFAULT '[]',score REAL DEFAULT 0,total REAL DEFAULT 0,detail TEXT DEFAULT '[]',passed BOOLEAN DEFAULT FALSE,completed_at VARCHAR(50) DEFAULT '')`);
  await _pool.query(`CREATE TABLE IF NOT EXISTS employees (id VARCHAR(255) PRIMARY KEY,name VARCHAR(100) NOT NULL,department VARCHAR(200) DEFAULT '',employee_id VARCHAR(100) NOT NULL,browser_id VARCHAR(255) DEFAULT NULL,created_at VARCHAR(50) DEFAULT '')`);
  await _pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id)`);
  await _pool.query(`CREATE TABLE IF NOT EXISTS questions (id VARCHAR(255) PRIMARY KEY,category VARCHAR(200) DEFAULT '',type VARCHAR(20) DEFAULT 'single',text TEXT NOT NULL,options TEXT DEFAULT '[]',correct_answer TEXT DEFAULT '[]',score REAL DEFAULT 1,tags TEXT DEFAULT '[]',created_at VARCHAR(50) DEFAULT '')`);
}

export async function initDB() {
  if (hasPostgres()) {
    try { await getPool(); } catch {}
  }
}

// ===== 使用文件还是 PG？ =====
async function withStore<T>(pgFn: () => Promise<T>, fileFn: () => T): Promise<T> {
  try {
    await getPool();
    return await pgFn();
  } catch {
    return fileFn();
  }
}

// ===== 课程 =====
export async function getCourses(): Promise<Course[]> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM courses ORDER BY created_at DESC");
      return rows.map(mapCourse);
    },
    () => fileStore.getCourses()
  );
}

export async function getCourse(id: string): Promise<Course | undefined> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM courses WHERE id = $1", [id]);
      return rows[0] ? mapCourse(rows[0]) : undefined;
    },
    () => fileStore.getCourse(id)
  );
}

export async function addCourse(course: Course): Promise<void> {
  await withStore(
    async () => {
      await (await getPool()).query("INSERT INTO courses (id,title,description,video_url,required_exam_id,duration,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [course.id, course.title, course.description || "", course.videoUrl || "", course.requiredExamId || null, course.duration, course.createdAt]);
    },
    () => { fileStore.addCourse(course); }
  );
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<void> {
  await withStore(
    async () => {
      const s: string[] = []; const v: any[] = []; let i = 1;
      if (data.title !== undefined) { s.push(`title=$${i++}`); v.push(data.title); }
      if (data.description !== undefined) { s.push(`description=$${i++}`); v.push(data.description); }
      if (data.videoUrl !== undefined) { s.push(`video_url=$${i++}`); v.push(data.videoUrl); }
      if (data.duration !== undefined) { s.push(`duration=$${i++}`); v.push(data.duration); }
      if (data.requiredExamId !== undefined) { s.push(`required_exam_id=$${i++}`); v.push(data.requiredExamId || null); }
      if (!s.length) return;
      v.push(id);
      await (await getPool()).query(`UPDATE courses SET ${s.join(",")} WHERE id=$${i}`, v);
    },
    () => { fileStore.updateCourse(id, data); }
  );
}

export async function deleteCourse(id: string): Promise<void> {
  await withStore(
    async () => { await (await getPool()).query("DELETE FROM courses WHERE id=$1", [id]); },
    () => { fileStore.deleteCourse(id); }
  );
}

// ===== 考试 =====
export async function getExams(): Promise<Exam[]> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM exams ORDER BY created_at DESC");
      return rows.map(mapExam);
    },
    () => fileStore.getExams()
  );
}

export async function getExam(id: string): Promise<Exam | undefined> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM exams WHERE id=$1", [id]);
      return rows[0] ? mapExam(rows[0]) : undefined;
    },
    () => fileStore.getExam(id)
  );
}

export async function addExam(exam: Exam): Promise<void> {
  await withStore(
    async () => {
      await (await getPool()).query("INSERT INTO exams (id,title,description,passing_score,mode,question_selection,questions,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [exam.id, exam.title, exam.description || "", exam.passingScore, exam.mode || "fixed", exam.questionSelection ? JSON.stringify(exam.questionSelection) : null, JSON.stringify(exam.questions), exam.createdAt]);
    },
    () => { fileStore.addExam(exam); }
  );
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<void> {
  await withStore(
    async () => {
      const s: string[] = []; const v: any[] = []; let i = 1;
      if (data.title !== undefined) { s.push(`title=$${i++}`); v.push(data.title); }
      if (data.description !== undefined) { s.push(`description=$${i++}`); v.push(data.description); }
      if (data.passingScore !== undefined) { s.push(`passing_score=$${i++}`); v.push(data.passingScore); }
      if (data.mode !== undefined) { s.push(`mode=$${i++}`); v.push(data.mode); }
      if (data.questionSelection !== undefined) { s.push(`question_selection=$${i++}`); v.push(JSON.stringify(data.questionSelection)); }
      if (data.questions !== undefined) { s.push(`questions=$${i++}`); v.push(JSON.stringify(data.questions)); }
      if (!s.length) return;
      v.push(id);
      await (await getPool()).query(`UPDATE exams SET ${s.join(",")} WHERE id=$${i}`, v);
    },
    () => { fileStore.updateExam(id, data); }
  );
}

export async function deleteExam(id: string): Promise<void> {
  await withStore(
    async () => { await (await getPool()).query("DELETE FROM exams WHERE id=$1", [id]); },
    () => { fileStore.deleteExam(id); }
  );
}

// ===== 员工 =====
export async function getEmployees(): Promise<Employee[]> {
  try {
    await getPool();
    const { rows } = await _pool.query("SELECT * FROM employees ORDER BY employee_id");
    return rows.map(mapEmployee);
  } catch {
    return readJSON<Employee[]>(EMPLOYEES_FILE, []);
  }
}

export async function getEmployeeByLogin(name: string, employeeId: string): Promise<Employee | undefined> {
  try {
    await getPool();
    const { rows } = await _pool.query("SELECT * FROM employees WHERE name=$1 AND employee_id=$2 LIMIT 1", [name, employeeId]);
    return rows[0] ? mapEmployee(rows[0]) : undefined;
  } catch {
    const emps = readJSON<Employee[]>(EMPLOYEES_FILE, []);
    return emps.find((e) => e.name === name && e.employeeId === employeeId);
  }
}

export async function getEmployeeById(id: string): Promise<Employee | undefined> {
  try {
    await getPool();
    const { rows } = await _pool.query("SELECT * FROM employees WHERE id=$1 LIMIT 1", [id]);
    return rows[0] ? mapEmployee(rows[0]) : undefined;
  } catch {
    const emps = readJSON<Employee[]>(EMPLOYEES_FILE, []);
    return emps.find((e) => e.id === id);
  }
}

export async function addEmployee(emp: Employee): Promise<void> {
  try {
    await getPool();
    try {
      await _pool.query("INSERT INTO employees (id,name,department,employee_id,browser_id,created_at) VALUES ($1,$2,$3,$4,$5,$6)", [emp.id, emp.name, emp.department || "", emp.employeeId, emp.browserId || null, emp.createdAt]);
    } catch (e: any) {
      if (!e.message?.includes("duplicate key")) throw e;
    }
  } catch {
    const emps = readJSON<Employee[]>(EMPLOYEES_FILE, []);
    if (!emps.find((e) => e.employeeId === emp.employeeId)) {
      emps.push(emp);
      writeJSON(EMPLOYEES_FILE, emps);
    }
  }
}

export async function batchAddEmployees(emps: Employee[]): Promise<number> {
  let added = 0;
  for (const emp of emps) {
    try {
      await addEmployee(emp);
      added++;
    } catch {}
  }
  return added;
}

export async function deleteEmployee(id: string): Promise<void> {
  try {
    await getPool();
    await _pool.query("DELETE FROM employees WHERE id=$1", [id]);
  } catch {
    let emps = readJSON<Employee[]>(EMPLOYEES_FILE, []);
    emps = emps.filter((e) => e.id !== id);
    writeJSON(EMPLOYEES_FILE, emps);
  }
}

export async function updateEmployeeBrowserId(id: string, browserId: string): Promise<void> {
  try {
    await getPool();
    await _pool.query("UPDATE employees SET browser_id=$1 WHERE id=$2", [browserId, id]);
  } catch {
    const emps = readJSON<Employee[]>(EMPLOYEES_FILE, []);
    const idx = emps.findIndex((e) => e.id === id);
    if (idx !== -1) {
      emps[idx].browserId = browserId;
      writeJSON(EMPLOYEES_FILE, emps);
    }
  }
}

export async function clearAllEmployees(): Promise<void> {
  try {
    await getPool();
    await _pool.query("DELETE FROM employees");
  } catch {
    writeJSON(EMPLOYEES_FILE, []);
  }
}

// ===== 观看记录 =====
export async function getWatchRecord(userId: string, courseId: string): Promise<WatchRecord | undefined> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM watch_records WHERE user_id=$1 AND course_id=$2 LIMIT 1", [userId, courseId]);
      return rows[0] ? mapWatch(rows[0]) : undefined;
    },
    () => fileStore.getWatchRecord(userId, courseId)
  );
}

export async function getWatchRecords(userId: string): Promise<WatchRecord[]> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM watch_records WHERE user_id=$1 ORDER BY updated_at DESC", [userId]);
      return rows.map(mapWatch);
    },
    () => fileStore.getWatchRecords(userId)
  );
}

export async function upsertWatchRecord(record: WatchRecord): Promise<void> {
  await withStore(
    async () => {
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
    },
    () => { fileStore.upsertWatchRecord(record); }
  );
}

// ===== 考试记录 =====
export async function getExamRecords(userId: string): Promise<ExamRecord[]> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM exam_records WHERE user_id=$1 ORDER BY completed_at DESC", [userId]);
      return rows.map(mapExamRecord);
    },
    () => fileStore.getExamRecords(userId)
  );
}

export async function getAllExamRecords(): Promise<ExamRecord[]> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM exam_records ORDER BY completed_at DESC");
      return rows.map(mapExamRecord);
    },
    () => fileStore.getAllExamRecords()
  );
}

export async function addExamRecord(record: ExamRecord): Promise<void> {
  await withStore(
    async () => {
      await (await getPool()).query("INSERT INTO exam_records (id,user_id,exam_id,answers,score,total,detail,passed,completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [record.id, record.userId, record.examId, JSON.stringify(record.answers), record.score, record.total, JSON.stringify(record.detail), record.passed, record.completedAt]);
    },
    () => { fileStore.addExamRecord(record); }
  );
}

// ===== 映射 =====
function mapCourse(r: any): Course {
  return { id: r.id, title: r.title, description: r.description || "", videoUrl: r.video_url || "", requiredExamId: r.required_exam_id || undefined, duration: r.duration || 300, createdAt: r.created_at || "" };
}
function mapExam(r: any): Exam {
  const qs = r.question_selection ? JSON.parse(r.question_selection) : undefined;
  return { id: r.id, title: r.title, description: r.description || "", passingScore: r.passing_score || 60, mode: (r.mode || "fixed") as any, questionSelection: qs, questions: JSON.parse(r.questions || "[]"), createdAt: r.created_at || "" };
}
function mapWatch(r: any): WatchRecord {
  return { id: r.id, userId: r.user_id, courseId: r.course_id, progress: r.progress || 0, completed: r.completed || false, updatedAt: r.updated_at || "" };
}
function mapExamRecord(r: any): ExamRecord {
  return { id: r.id, userId: r.user_id, examId: r.exam_id, answers: JSON.parse(r.answers || "[]"), score: r.score || 0, total: r.total || 0, detail: JSON.parse(r.detail || "[]"), passed: r.passed || false, completedAt: r.completed_at || "" };
}
function mapEmployee(r: any): Employee {
  return { id: r.id, name: r.name, department: r.department || "", employeeId: r.employee_id, browserId: r.browser_id || undefined, createdAt: r.created_at || "" };
}

// ===== 题库 =====
export async function getQuestions(): Promise<QuestionBankItem[]> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT * FROM questions ORDER BY category,created_at");
      return rows.map(mapQuestion);
    },
    () => fileStore.getQuestions()
  );
}

export async function getQuestionCategories(): Promise<string[]> {
  return withStore(
    async () => {
      const { rows } = await (await getPool()).query("SELECT DISTINCT category FROM questions WHERE category IS NOT NULL AND category != '' ORDER BY category");
      return rows.map((r: any) => r.category);
    },
    () => fileStore.getQuestionCategories()
  );
}

export async function addQuestion(q: QuestionBankItem): Promise<void> {
  await withStore(
    async () => {
      await (await getPool()).query(
        "INSERT INTO questions (id,category,type,text,options,correct_answer,score,tags,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [q.id, q.category || "", q.type, q.text, JSON.stringify(q.options), JSON.stringify(q.correctAnswer), q.score || 1, JSON.stringify(q.tags || []), q.createdAt]
      );
    },
    () => { fileStore.addQuestion(q); }
  );
}

export async function deleteQuestion(id: string): Promise<void> {
  await withStore(
    async () => { await (await getPool()).query("DELETE FROM questions WHERE id=$1", [id]); },
    () => { fileStore.deleteQuestion(id); }
  );
}

export async function clearAllQuestions(): Promise<void> {
  await withStore(
    async () => { await (await getPool()).query("DELETE FROM questions"); },
    () => { fileStore.clearAllQuestions(); }
  );
}

function mapQuestion(r: any): QuestionBankItem {
  return {
    id: r.id,
    category: r.category || "",
    type: r.type,
    text: r.text,
    options: JSON.parse(r.options || "[]"),
    correctAnswer: JSON.parse(r.correct_answer || "[]"),
    score: r.score || 1,
    tags: JSON.parse(r.tags || "[]"),
    createdAt: r.created_at || "",
  };
}
