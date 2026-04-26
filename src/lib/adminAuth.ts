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

export function verifyAdmin(username: string, password: string): boolean {
  const admins = readAdmins();
  const admin = admins.find((a) => a.username === username);
  if (!admin) return false;
  return admin.passwordHash === hashPassword(password, admin.salt);
}
