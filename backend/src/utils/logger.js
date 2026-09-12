const isTest = process.env.NODE_ENV === 'test';

function info(...args) {
  if (!isTest) console.log('[INFO]', ...args);
}

function warn(...args) {
  if (!isTest) console.warn('[WARN]', ...args);
}

function error(...args) {
  if (!isTest) console.error('[ERROR]', ...args);
}

module.exports = { info, warn, error };
