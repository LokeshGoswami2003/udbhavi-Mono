const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === "development" ? "debug" : "info");

function shouldLog(level) {
  return levels[level] >= (levels[currentLevel] ?? levels.info);
}

function formatValue(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "development" ? value.stack : undefined,
    };
  }

  return value;
}

function write(level, message, meta = {}) {
  if (!shouldLog(level) || process.env.NODE_ENV === "test") {
    return;
  }

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...Object.fromEntries(
      Object.entries(meta).map(([key, value]) => [key, formatValue(value)]),
    ),
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
}

export const logger = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};
