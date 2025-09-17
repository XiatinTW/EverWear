// 輸入驗證工具函數
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: '輸入驗證失敗',
        details: errors
      });
    }
    
    req.validatedData = value;
    next();
  };
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^[0-9+()-\s]{8,20}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  // 至少 8 個字符，包含大小寫字母和數字
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

module.exports = {
  validate,
  validateEmail,
  validatePhone,
  validatePassword,
  sanitizeInput
};
