const express = require('express');
const { UserController } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 所有用戶路由都需要認證
router.use(authenticate);

// 獲取當前用戶資料
router.get('/me', UserController.getProfile);

// 更新用戶資料
router.put('/me', UserController.updateProfile);

// 更新密碼
router.put('/me/password', UserController.updatePassword);

// 更新電子郵件
router.put('/me/email', UserController.updateEmail);

// 刪除帳號
router.delete('/me', UserController.deleteAccount);

module.exports = router;
