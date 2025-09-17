import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// 密碼加密
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// 密碼驗證
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// 生成 JWT 令牌
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET, // 這裡要和後端驗證一致
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// 生成隨機字符串
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// 生成驗證碼
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 格式化日期
export const formatDate = (date) => {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
};

// 分頁計算
export const calculatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems: total,
    offset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

// API 響應格式化
export const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

export const errorResponse = (message, details = null) => {
  const response = {
    success: false,
    error: message
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
};
