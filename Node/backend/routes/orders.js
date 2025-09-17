const express = require('express');
const { OrderController } = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 會員訂單列表、統計、詳情、取消（需要登入）
router.get('/me', authenticate, (req, res, next) => {
  OrderController.getUserOrders(req, res, next);
});
router.get('/me/stats', authenticate, OrderController.getOrderStats);
router.get('/:id', authenticate, OrderController.getOrderById);
router.patch('/:id/cancel', authenticate, OrderController.cancelOrder);

// --- 建立訂單（匿名也可用）---
// router.post('/', optionalAuth, OrderController.createOrder); // 如果有 createOrder API

module.exports = router;
router.get('/:id', OrderController.getOrderById);

// 取消訂單
router.patch('/:id/cancel', OrderController.cancelOrder);

module.exports = router;
