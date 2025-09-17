const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fashion_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
module.exports = pool;

/* 
-- 在 MySQL CLI 或 phpMyAdmin 執行
INSERT INTO categories (category_id, name) VALUES ('外套', '外套');
*/