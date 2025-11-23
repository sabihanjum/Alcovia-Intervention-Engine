const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Don't fail immediately if connection fails
  connectionTimeoutMillis: 3000,
});

// Handle connection errors gracefully
pool.on('error', (err) => {
  console.log('Database connection error (will use mock data):', err.message);
});

module.exports = pool;
