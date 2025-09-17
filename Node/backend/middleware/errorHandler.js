// 錯誤處理中介層
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // 開發環境顯示詳細錯誤
  if (process.env.NODE_ENV === 'development') {
    console.error('錯誤詳情:', err);
  }

  // MySQL 錯誤處理
  if (err.code === 'ER_DUP_ENTRY') {
    const message = '資料重複，請檢查輸入內容';
    error = { statusCode: 400, message };
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = '參考的資料不存在';
    error = { statusCode: 400, message };
  }

  // JWT 錯誤處理
  if (err.name === 'JsonWebTokenError') {
    const message = '無效的認證令牌';
    error = { statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = '認證令牌已過期';
    error = { statusCode: 401, message };
  }

  // 驗證錯誤
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { statusCode: 400, message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || '伺服器內部錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
