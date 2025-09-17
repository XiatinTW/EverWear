const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT 認證中介層
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '需要提供認證令牌'
      });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await query(
      'SELECT user_id as id, email, username, first_name, last_name, email_verified, created_at FROM users WHERE user_id = ?',
      [decoded.userId]
    );
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: '用戶不存在'
      });
    }
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: '無效的認證令牌'
    });
  }
}

// 可選認證中介層（用於可以登入或不登入都能存取的 API）
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await query(
        'SELECT user_id as id, email, username, first_name, last_name, email_verified, created_at FROM users WHERE user_id = ?',
        [decoded.userId]
      );
      if (users.length > 0) {
        req.user = users[0];
      }
    }
    // 無論有沒有 token，都會繼續往下執行
    next();
  } catch (error) {
    // 忽略認證錯誤，繼續處理請求
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth
};
