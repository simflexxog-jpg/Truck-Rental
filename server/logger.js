const isProduction = process.env.NODE_ENV === 'production';

function formatEntry(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  return isProduction ? JSON.stringify(entry) : `[${entry.level}] ${entry.message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
}

function log(level, message, meta = {}) {
  const output = formatEntry(level, message, meta);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

module.exports = {
  logger: {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta)
  },
  log
};
