const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// 資料庫連接池配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fashion_db', // 統一預設為 fashion_db
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',  // 設定時區為 UTC
  dateStrings: true    // 將日期作為字符串返回
};

// 建立連接池
const pool = mysql.createPool(dbConfig);

// 資料庫連接測試
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 資料庫連接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL 資料庫連接失敗:', error.message);
    return false;
  }
}

// 執行 SQL 查詢的通用函數
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('資料庫查詢錯誤:', error.message);
    throw error;
  }
}

// 執行事務
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  query,
  transaction
};
