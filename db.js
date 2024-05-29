const { Pool } = require('pg');

/*
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
*/

const pool = new Pool({
  user: 'debian',
  host: 'localhost',
  database: 'expressdb',
  password: 'debian',
  port: 5432,
});

module.exports = pool;
