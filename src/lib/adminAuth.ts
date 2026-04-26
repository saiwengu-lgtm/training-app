import fs from "fs";
import path from "path";
import crypto from "crypto";

const ADMIN_FILE = path.join(process.cwd(), "data", "admin.json");

interface AdminUser {
  username: string;
  passwordHash: string;
  salt: string;
}

function readAdmins(): AdminUser[] {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function writeAdmins(admins: AdminUser[]) {
  const dir = path.dirname(ADMIN_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admins, null, 2), "utf-8");
}

function hashPassword(password: string, salt: string): string {
  return crypto.createHash("sha256").update(password + salt).digest("hex");
}

export function initAdmin(username: string, password: string) {
  const admins = readAdmins();
  const existing = admins.find((a) => a.username === username);
  if (existing) return; // already exists

  const salt = crypto.randomBytes(16).toString("hex");
  admins.push({
    username,
    passwordHash: hashPassword(password, salt),
    salt,
  });
  writeAdmins(admins);
}

// 内置管理员（线上环境文件不可写时的兜底方案）
const BUILTIN_ADMINS: Array<{ username: string; password: string }> = [
  { username: "谷赛文", password: "gyll1227" },
];

export function verifyAdmin(username: string, password: string): boolean {
  // 1. 内置管理员
  for (const a of BUILTIN_ADMINS) {
    if (a.username === username && a.password === password) {
      return true;
    }
  }
  // 2. 环境变量兜底
  const envUser = process.env.ADMIN_USERNAME || "admin";
  const envPass = process.env.ADMIN_PASSWORD;
  if (envPass && username === envUser && password === envPass) {
    return true;
  }
  // 3. 文件方式
  const admins = readAdmins();
  const admin = admins.find((a) => a.username === username);
  if (!admin) return false;
  return admin.passwordHash === hashPassword(password, admin.salt);
}
