const { Pool } = require('pg');
const { logger } = require('../logger');

let pool = null;

function getDbPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.on('error', (error) => {
      logger.warn('PostgreSQL pool error', { error: error.message });
    });
  }
  return pool;
}

module.exports = { getDbPool };
