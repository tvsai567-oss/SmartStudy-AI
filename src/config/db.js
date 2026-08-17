// ─────────────────────────────────────────────
//  SmartStudy AI — Local Persistent File Database
// ─────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial DB schema
const initialData = {
  users: [],
  otps: [],
  chats: [],
  quizzes: []
};

// Initialize DB file if missing
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
}

function readDB() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    logger.error('Failed to read DB file:', err.message);
    return initialData;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write DB file:', err.message);
  }
}

// Password Hashing Helper
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_smartstudy_salt').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// User CRUD operations
function findUserByEmail(email) {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  const db = readDB();
  return db.users.find(u => u.id === id);
}

function createUser({ email, password, full_name, class_level }) {
  const db = readDB();
  if (findUserByEmail(email)) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    full_name: full_name.trim(),
    class_level: parseInt(class_level) || 8,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);
  return newUser;
}

function updateUserPassword(email, newPassword) {
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('User not found.');

  user.passwordHash = hashPassword(newPassword);
  writeDB(db);
  return true;
}

function updateUserProfile(id, { full_name, class_level }) {
  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) throw new Error('User not found.');

  if (full_name) user.full_name = full_name.trim();
  if (class_level) user.class_level = parseInt(class_level);
  writeDB(db);
  return user;
}

// OTP Operations
function createOTP(email) {
  const db = readDB();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Filter out previous OTPs for this email
  db.otps = db.otps.filter(o => o.email.toLowerCase() !== email.toLowerCase());

  db.otps.push({
    email: email.toLowerCase(),
    code: otpCode,
    expiresAt
  });

  writeDB(db);
  return otpCode;
}

function verifyOTP(email, code) {
  const db = readDB();
  const record = db.otps.find(o => o.email.toLowerCase() === email.toLowerCase() && o.code === code.trim());

  if (!record) return false;
  if (Date.now() > record.expiresAt) return false;

  return true;
}

function clearOTP(email) {
  const db = readDB();
  db.otps = db.otps.filter(o => o.email.toLowerCase() !== email.toLowerCase());
  writeDB(db);
}

module.exports = {
  readDB,
  writeDB,
  hashPassword,
  verifyPassword,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  updateUserProfile,
  createOTP,
  verifyOTP,
  clearOTP
};
