// ─────────────────────────────────────────────
//  SmartStudy AI — Logger Utility
// ─────────────────────────────────────────────

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

function log(level, color, ...args) {
  if (LEVELS[level] > currentLevel) return;
  const prefix = `${colors.gray}[${timestamp()}]${colors.reset} ${color}[${level.toUpperCase()}]${colors.reset}`;
  console.log(prefix, ...args);
}

const logger = {
  error: (...args) => log('error', colors.red, ...args),
  warn:  (...args) => log('warn',  colors.yellow, ...args),
  info:  (...args) => log('info',  colors.cyan, ...args),
  debug: (...args) => log('debug', colors.gray, ...args),
};

module.exports = logger;
