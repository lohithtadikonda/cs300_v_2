const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'iiitg_srs',
  password: 'postgres', // ✅ explicitly set
  port: 5432,
});

// Force connection check
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ DB connection failed:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};