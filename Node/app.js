require('dotenv').config(); // 最上方加這行

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
// const morgan = require('morgan');
// 如果你的主程式 server.js 有這行：
// const morgan = require('morgan');
// app.use(morgan('combined'));
// 可以註解掉或刪除：
// // app.use(morgan('combined'));
const app = express();

// 路由模組
const itemRouter = require('./ItemCRUD.mysql');
const apiRouter = require('./userserver.mysql'); // userserver.js 改名為 userserver.mysql.js

// 基本中介層
app.use(helmet());
const corsOptions = {
  origin: true, // 或指定你的前端網址
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
// app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案
app.use('/image', express.static(path.join(__dirname, './assets')));

// 其他所有 API（會員、訂單、聯絡、購物車、wishlist...）
app.use('/api', apiRouter);

// 商品相關 API
app.use('/', itemRouter);

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});