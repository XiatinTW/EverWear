const express = require('express');
const { ContactController } = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 所有聯絡訊息路由都需要認證
router.use(authenticate);

// 建立新的聯絡主題
router.post('/', ContactController.createThread);

// 獲取用戶的聊天串列表
router.get('/', ContactController.getUserThreads);

// 獲取特定聊天串的詳細資訊
router.get('/:id', ContactController.getThread);

// 獲取聊天串的所有訊息
router.get('/:id/messages', ContactController.getThreadMessages);

// 回覆聊天串
router.post('/:id/reply', ContactController.replyToThread);

// 關閉聊天串
router.patch('/:id/close', ContactController.closeThread);

// 重新開啟聊天串
router.patch('/:id/reopen', ContactController.reopenThread);

module.exports = router;
