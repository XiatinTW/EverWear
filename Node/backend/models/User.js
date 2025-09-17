const { query, transaction } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/helpers');
const crypto = require('crypto');

const UserModel = {
  // 根據 email 查找用戶 (適配實際資料庫結構)
  findByEmail: async function(email) {
    const users = await query(
      'SELECT user_id as id, email, username, first_name, last_name, phone, address, birth_day, google_id, password_hash, email_verified, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  },

  // 根據 ID 查找用戶
  findById: async function(id) {
    const users = await query(
      'SELECT user_id as id, email, username, first_name, last_name, phone, address, birth_day, google_id, password_hash, email_verified, created_at, updated_at FROM users WHERE user_id = ?',
      [id]
    );
    return users[0] || null;
  },

  // 建立新用戶（使用 snake_case 欄位）
  create: async function(userData) {
    const { email, password, username, first_name, last_name, phone } = userData;
    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    await query(
      `INSERT INTO users (user_id, email, password_hash, username, first_name, last_name, phone, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, email, hashedPassword, username, first_name, last_name, phone || null]
    );
    return userId;
  },

  // 驗證用戶密碼
  validatePassword: async function(email, password) {
    const users = await query(
      'SELECT user_id, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) return null;
    const user = users[0];
    
    // 如果用戶沒有密碼（Google 用戶），返回 null
    if (!user.password_hash) return null;
    
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) return null;
    return { id: user.user_id, email: user.email };
  },

  // 更新用戶資料
  updateProfile: async function(userId, updateData) {
    const allowedFields = ['username', 'first_name', 'last_name', 'phone', 'address', 'birth_day'];
    const updates = [];
    const values = [];
    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });
    if (updates.length === 0) throw new Error('沒有可更新的欄位');
    values.push(userId);
    await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
      values
    );
    return await this.findById(userId);
  },

  // 更新密碼
  updatePassword: async function(userId, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    await query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',[hashedPassword, userId]
    );
  },

  setEmailVerified: async function(userId, verified = true) {
    await query(
      'UPDATE users SET email_verified = ?, updated_at = NOW() WHERE user_id = ?',
      [verified ? 1 : 0, userId]
    );
  },

  emailExists: async function(email, excludeUserId = null) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const params = [email];
    if (excludeUserId) { sql += ' AND user_id != ?'; params.push(excludeUserId); }
    const result = await query(sql, params);
    return result[0].count > 0;
  },

  usernameExists: async function(username, excludeUserId = null) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const params = [username];
    if (excludeUserId) { sql += ' AND user_id != ?'; params.push(excludeUserId); }
    const result = await query(sql, params);
    return result[0].count > 0;
  },

  setVerificationToken: async function(userId, token, expiresAt) {
    await query(
      'UPDATE users SET email_verification_token = ?, email_verification_expiry = ?, updated_at = NOW() WHERE user_id = ?',
      [token, expiresAt, userId]
    );
  },

  findByVerificationToken: async function(token) {
    const users = await query(
      'SELECT user_id as id, email, username, first_name, last_name, email_verified, email_verification_expiry FROM users WHERE email_verification_token = ?',
      [token]
    );
    return users[0] || null;
  },

  confirmEmailVerification: async function(userId) {
    await query(
      'UPDATE users SET email_verified = 1, updated_at = NOW() WHERE user_id = ?',
      [userId]
    );
  },

  setPasswordResetToken: async function(userId, token, expiresAt) {
    await query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = NOW() WHERE user_id = ?',
      [token, expiresAt, userId]
    );
  },

  findByResetToken: async function(token) {
    const users = await query(
      'SELECT user_id as id, email, username, first_name, last_name, reset_token_expires FROM users WHERE reset_token = ?',
      [token]
    );
    return users[0] || null;
  },

  confirmPasswordReset: async function(userId, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    await query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE user_id = ?',
      [hashedPassword, userId]
    );
  },

  findByEmailWithTokens: async function(email) {
    const users = await query(
      'SELECT user_id as id, email, username, first_name, last_name, email_verified, email_verification_token, email_verification_expiry, reset_token, reset_token_expires FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  },

  findByGoogleId: async function(googleId) {
    const users = await query(
      'SELECT user_id as id, email, username, first_name, last_name, google_id, email_verified FROM users WHERE google_id = ?',
      [googleId]
    );
    return users[0] || null;
  },

  bindGoogleAccount: async function(userId, googleId) {
    await query(
      'UPDATE users SET google_id = ?, login_method = "google", email_verified = 1, updated_at = NOW() WHERE user_id = ?',
      [googleId, userId]
    );
  },

  createGoogleUser: async function(userData) {
    const { googleId, email, first_name = '', last_name = '' } = userData; // 使用 snake_case
    const userId = crypto.randomUUID();
    await query(
      `INSERT INTO users (user_id, email, username, first_name, last_name, google_id, login_method, email_verified, password_hash, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'google', 1, NULL, NOW(), NOW())`,
      [userId, email, email, first_name, last_name, googleId]
    );
    return userId;
  },

  // 設定帳號啟用狀態
  setActiveStatus: async function(userId, isActive) {
    await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?', [isActive ? 1 : 0, userId]);
  },

  // 創建優惠碼並分配給用戶
  createAndAssignCoupon: async function(userId, couponCode, description = '新會員歡迎優惠') {
    return await transaction(async (connection) => {
      // 計算到期日（30天後）
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const formattedDate = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      
      // 1. 插入優惠碼到 discounts 表
      const [discountResult] = await connection.execute(
        'INSERT INTO discounts (code, description, expiry_date, is_active) VALUES (?, ?, ?, TRUE)',
        [couponCode, description, formattedDate]
      );
      const discountId = discountResult.insertId;
      
      // 2. 分配給用戶
      await connection.execute(
        'INSERT INTO user_discounts (user_id, discount_id, assigned_at, used) VALUES (?, ?, NOW(), FALSE)',
        [userId, discountId]
      );
      
      return discountId;
    });
  }
};

module.exports = { UserModel };
