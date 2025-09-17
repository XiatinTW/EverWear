const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();

// 路由導入（確保每個都是 Express Router 實例）
const authRoutes = require('./backend/routes/auth');
const userRoutes = require('./backend/routes/users');
const contactRoutes = require('./backend/routes/contacts');
const orderRoutes = require('./backend/routes/orders');

// API 路由
router.use('/v2/auth', authRoutes);
router.use('/v2/users', userRoutes);
router.use('/v2/contacts', contactRoutes);
router.use('/v2/orders', orderRoutes);

// 健康檢查
router.get('/v2/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.1.0'
  });
});

// ...existing code for other API routes...

module.exports = router;
