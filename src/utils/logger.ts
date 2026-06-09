import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(__dirname, "..", "..", ".arena-auto", "logs");

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

const currentLevel = (process.env.LOG_LEVEL || "info").toLowerCase();

function shouldLog(level: LogLevel): boolean {
  const order = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  return order.indexOf(level) >= order.indexOf(currentLevel as LogLevel);
}

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry) + "\n";
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const line = formatEntry(level, message, meta);

  process.stderr.write(line);

  try {
    ensureLogDir();
    const today = new Date().toISOString().slice(0, 10);
    const logFile = path.join(LOG_DIR, `${today}.log`);
    fs.appendFileSync(logFile, line);
  } catch {
    // silently fail if we can't write to log file
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log(LogLevel.DEBUG, msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log(LogLevel.INFO, msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log(LogLevel.WARN, msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log(LogLevel.ERROR, msg, meta),
};
