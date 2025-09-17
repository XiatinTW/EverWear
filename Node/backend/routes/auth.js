const express = require('express');
const { AuthController } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 用戶註冊
router.post('/register', AuthController.register);

// 用戶登入
router.post('/login', AuthController.login);

// Google 登入
router.post('/google-login', AuthController.googleLogin);

// 驗證令牌
router.get('/verify', authenticate, AuthController.verifyToken);

// 郵件驗證相關
router.post('/verify-email', AuthController.verifyEmail);
router.get('/verify-email/:token', AuthController.verifyEmail); // 新增 GET 路由支持
router.post('/resend-verification', AuthController.resendVerificationEmail);

// 密碼重設相關
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/confirm-password-reset', AuthController.confirmPasswordReset);

// 發送電子郵件驗證碼 (舊版，保留相容性)
router.post('/send-verification', authenticate, AuthController.sendEmailVerification);

// 驗證電子郵件 (舊版，保留相容性)
router.post('/verify-email-old', authenticate, AuthController.verifyEmail);

module.exports = router;
