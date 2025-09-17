// 商品 CRUD API (MySQL 版本)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('./db'); // 引入資料庫連線

const MOCK_USER_ID = 'test_user_id'; //測試用的假 user_id

// =============================================
// 圖片上傳設置
// =============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, './assets/itemImage'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// =============================================
// 取得所有商品（含圖片、尺寸、顏色）
// =============================================
router.get('/api/items', async (req, res) => {
  try {
    let products;
    if (req.query.product_id) {
      [products] = await db.query('SELECT * FROM products WHERE product_id=?', [req.query.product_id]);
    } else {
      [products] = await db.query('SELECT * FROM products');
    }
    for (const prod of products) {
      // 取得圖片
      const [imgs] = await db.query('SELECT image_url FROM product_images WHERE product_id=?', [prod.product_id]);
      prod.images = imgs.map(i => {
        const filename = path.basename(i.image_url);
        // 修正路徑
        return `/image/itemImage/${filename}`;
      });

      // 取得尺寸
      const [szs] = await db.query(
        'SELECT s.name FROM product_available_sizes pas JOIN sizes s ON pas.size_id=s.size_id WHERE pas.product_id=?',
        [prod.product_id]
      );
      prod.sizes = szs.map(s => s.name);

      // 取得顏色
      const [colors] = await db.query(
        'SELECT c.name, c.hex_code, c.color_id FROM product_available_colors pac JOIN colors c ON pac.color_id=c.color_id WHERE pac.product_id=?',
        [prod.product_id]
      );
      prod.colors = colors; // [{name, hex_code, color_id}]

      // 取得庫存
      const [stockRows] = await db.query(
        `SELECT ps.quantity, s.name AS size_name
         FROM product_stock ps
         JOIN sizes s ON ps.size_id = s.size_id
         WHERE ps.product_id=?`,
        [prod.product_id]
      );
      prod.stock = stockRows;
    }
    console.log('[GET /items] 回傳商品數量:', products.length);
    res.json(products);
  } catch (err) {
    console.error('[GET /items] 錯誤:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 新增商品
// =============================================
router.post('/api/items', upload.array('image', 10), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, description, description_long, charactor, material,
      size_url, price, category_id, images, sizes,
      stock = [], color_name, color_hex
    } = req.body;

    // 1. 新增主商品（不含 color_name, color_hex 欄位）
    const [result] = await conn.query(
      `INSERT INTO products (
        product_id, name, description, description_long, charactor, material,
        size_url, price, category_id, created_at, updated_at
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )`,
      [
        name, description, description_long, charactor, material,
        size_url, price, category_id
      ]
    );
    console.log('[POST /items] 新增商品結果:', result);

    // 取得新商品ID
    const [idRows] = await conn.query('SELECT product_id FROM products ORDER BY created_at DESC LIMIT 1');
    const productId = idRows[0]?.product_id;
    console.log('[POST /items] 新商品ID:', productId);

    // 2. 新增圖片到 product_images
    let imageArr = [];
    if (req.files && req.files.length > 0) {
      imageArr = req.files.map(f => f.filename); // 只存檔名
    } else if (images) {
      imageArr = Array.isArray(images) ? images : JSON.parse(images);
    }
    console.log('[POST /items] 新增圖片:', imageArr);
    for (const imgName of imageArr) {
      const imgResult = await conn.query(
        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
        [productId, imgName]
      );
      console.log('[POST /items] 新增圖片結果:', imgResult);
    }

    // 3. 新增尺寸到 product_available_sizes
    // size_id: 1=S, 2=M, 3=L
    const sizesArr = sizes ? (Array.isArray(sizes) ? sizes : JSON.parse(sizes)) : [];
    console.log('[POST /items] 新增尺寸:', sizesArr);
    for (const sz of sizesArr) {
      // 會查詢 sizes 資料表取得對應的 size_id
      const [sizeRows] = await conn.query('SELECT size_id FROM sizes WHERE name=?', [sz]);
      console.log('[POST /items] 查詢尺寸:', sz, sizeRows);
      if (sizeRows.length) {
        const szResult = await conn.query(
          'INSERT INTO product_available_sizes (product_id, size_id) VALUES (?, ?)',
          [productId, sizeRows[0].size_id]
        );
        console.log('[POST /items] 新增尺寸結果:', szResult);
      }
    }

    // 4. 新增顏色到 colors 表
    let colorId;
    if (color_name && color_hex) {
      let [colorRows] = await conn.query('SELECT color_id FROM colors WHERE name=? AND hex_code=?', [color_name, color_hex]);
      if (colorRows.length) {
        colorId = colorRows[0].color_id;
        console.log('[POST /items] 已有顏色:', colorId);
      } else {
        const [insertColor] = await conn.query('INSERT INTO colors (name, hex_code) VALUES (?, ?)', [color_name, color_hex]);
        colorId = insertColor.insertId;
        console.log('[POST /items] 新增顏色:', colorId);
      }
      await conn.query(
        'INSERT INTO product_available_colors (product_id, color_id) VALUES (?, ?)',
        [productId, colorId]
      );
    }
    // 5. 新增庫存 product_stock
    if (Array.isArray(stock) && colorId) {
      for (const s of stock) {
        const [sizeRows] = await conn.query('SELECT size_id FROM sizes WHERE name=?', [s.size]);
        if (sizeRows.length) {
          await conn.query(
            'INSERT INTO product_stock (product_id, color_id, size_id, quantity) VALUES (?, ?, ?, ?)',
            [productId, colorId, sizeRows[0].size_id, s.quantity ?? 0]
          );
        }
      }
    }

    await conn.commit();

    const [rows] = await conn.query('SELECT * FROM products WHERE product_id=?', [productId]);
    console.log('[POST /items] 新增商品完成:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('[POST /items] 錯誤:', err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// =============================================
// 編輯商品
// =============================================
router.put('/api/items/:id', upload.array('image', 10), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, description, description_long, charactor, material,
      size_url, price, category_id, images, sizes,
      stock = [], color_name, color_hex
    } = req.body;

    // 更新主商品（不含 color_name, color_hex 欄位）
    await conn.query(
      `UPDATE products SET
        name=?, description=?, description_long=?, charactor=?, material=?,
        size_url=?, price=?, category_id=?, updated_at=NOW()
        WHERE product_id=?`,
      [
        name, description, description_long, charactor, material,
        size_url, price, category_id, req.params.id
      ]
    );

    // 處理圖片 product_images
    await conn.query('DELETE FROM product_images WHERE product_id=?', [req.params.id]);
    let imageArr = [];
    if (req.files && req.files.length > 0) {
      imageArr = req.files.map(f => f.filename);
    } else if (images) {
      imageArr = Array.isArray(images) ? images : JSON.parse(images);
    }
    for (const imgName of imageArr) {
      await conn.query(
        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
        [req.params.id, imgName]
      );
    }

    // 處理尺寸 product_available_sizes
    await conn.query('DELETE FROM product_available_sizes WHERE product_id=?', [req.params.id]);
    const sizesArr = sizes ? (Array.isArray(sizes) ? sizes : JSON.parse(sizes)) : [];
    for (const sz of sizesArr) {
      const [sizeRows] = await conn.query('SELECT size_id FROM sizes WHERE name=?', [sz]);
      if (sizeRows.length) {
        await conn.query(
          'INSERT INTO product_available_sizes (product_id, size_id) VALUES (?, ?)',
          [req.params.id, sizeRows[0].size_id]
        );
      }
    }

    // 處理顏色 product_available_colors & colors
    await conn.query('DELETE FROM product_available_colors WHERE product_id=?', [req.params.id]);
    let colorId;
    if (color_name && color_hex) {
      let [colorRows] = await conn.query('SELECT color_id FROM colors WHERE name=? AND hex_code=?', [color_name, color_hex]);
      if (colorRows.length) {
        colorId = colorRows[0].color_id;
      } else {
        const [insertColor] = await conn.query('INSERT INTO colors (name, hex_code) VALUES (?, ?)', [color_name, color_hex]);
        colorId = insertColor.insertId;
      }
      await conn.query(
        'INSERT INTO product_available_colors (product_id, color_id) VALUES (?, ?)',
        [req.params.id, colorId]
      );
    }
    // 更新庫存 product_stock
    await conn.query('DELETE FROM product_stock WHERE product_id=?', [req.params.id]);
    if (Array.isArray(stock) && colorId) {
      for (const s of stock) {
        const [sizeRows] = await conn.query('SELECT size_id FROM sizes WHERE name=?', [s.size]);
        if (sizeRows.length) {
          await conn.query(
            'INSERT INTO product_stock (product_id, color_id, size_id, quantity) VALUES (?, ?, ?, ?)',
            [req.params.id, colorId, sizeRows[0].size_id, s.quantity ?? 0]
          );
        }
      }
    }

    await conn.commit();

    const [rows] = await conn.query('SELECT * FROM products WHERE product_id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// =============================================
// 刪除商品
// =============================================
router.delete('/api/items/:id', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // 刪除所有關聯資料
    await conn.query('DELETE FROM product_images WHERE product_id=?', [req.params.id]);
    await conn.query('DELETE FROM product_available_sizes WHERE product_id=?', [req.params.id]);
    await conn.query('DELETE FROM product_available_colors WHERE product_id=?', [req.params.id]);
    await conn.query('DELETE FROM products WHERE product_id=?', [req.params.id]);
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// =============================================
// 圖片上傳 API（支援多張）
// =============================================
router.post('/api/upload', upload.array('image', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: '未選擇檔案' });
  const urls = req.files.map(f => `/assets/itemImage/${f.filename}`);
  res.json({ urls });
});

// =============================================
// 取得所有分類
// =============================================
router.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT category_id, name FROM categories');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 根據名稱查詢所有同名商品（不同顏色、不同 product_id）
// =============================================
router.get('/api/items/byname', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: '缺少 name 參數' });
  try {
    const [products] = await db.query('SELECT * FROM products WHERE name=?', [name]);
    for (const prod of products) {
      // 取得圖片
      const [imgs] = await db.query('SELECT image_url FROM product_images WHERE product_id=?', [prod.product_id]);
      prod.images = imgs.map(i => {
        const filename = path.basename(i.image_url);
        // 修正路徑
        return `/image/itemImage/${filename}`;
      });
      // 取得尺寸
      const [szs] = await db.query(
        'SELECT s.name FROM product_available_sizes pas JOIN sizes s ON pas.size_id=s.size_id WHERE pas.product_id=?',
        [prod.product_id]
      );
      prod.sizes = szs.map(s => s.name);
      // 取得顏色
      const [colors] = await db.query(
        'SELECT c.name, c.hex_code FROM product_available_colors pac JOIN colors c ON pac.color_id=c.color_id WHERE pac.product_id=?',
        [prod.product_id]
      );
      prod.colors = colors;
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 取得所有顏色（不重複）
// =============================================
router.get('/api/colors', async (req, res) => {
  try {
    const [colors] = await db.query('SELECT color_id, name, hex_code FROM colors');
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 取得指定商品、顏色的庫存
// =============================================
router.get('/api/product_stock', async (req, res) => {
  const { product_id, color_id } = req.query;
  if (!product_id || !color_id) return res.status(400).json({ error: '缺少參數' });
  try {
    const [rows] = await db.query(
      `SELECT ps.quantity, s.name AS size_name
       FROM product_stock ps
       JOIN sizes s ON ps.size_id = s.size_id
       WHERE ps.product_id=? AND ps.color_id=?`,
      [product_id, color_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 取得所有季型配色
// =============================================
router.get('/api/seasons', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT season_id, name FROM seasons');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 取得所有季型配色顏色
// =============================================
router.get('/api/season_colors', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sc.season_id, sc.color_id, c.name, c.hex_code
       FROM season_colors sc
       JOIN colors c ON sc.color_id = c.color_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 新增顏色到季型配色
// =============================================
router.post('/api/season_colors', async (req, res) => {
  const { season_id, color_id } = req.body;
  if (!season_id || !color_id) return res.status(400).json({ error: '缺少參數' });
  try {
    await db.query('INSERT IGNORE INTO season_colors (season_id, color_id) VALUES (?, ?)', [season_id, color_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 從季型配色表刪除顏色
// =============================================
router.delete('/api/season_colors', async (req, res) => {
  const { season_id, color_id } = req.body;
  if (!season_id || !color_id) return res.status(400).json({ error: '缺少參數' });
  try {
    await db.query('DELETE FROM season_colors WHERE season_id=? AND color_id=?', [season_id, color_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 根據季型配色推薦商品（卡片用）
// =============================================
router.get('/api/recommend_products', async (req, res) => {
  const { season_id } = req.query;
  if (!season_id) return res.status(400).json({ error: '缺少 season_id' });
  try {
    // 查詢該季型配色推薦的 color_id
    const [colorRows] = await db.query('SELECT color_id FROM season_colors WHERE season_id=?', [season_id]);
    if (!colorRows.length) return res.json([]);
    const colorIds = colorRows.map(r => r.color_id);

    // 查詢有這些 color_id 的商品
    const [productRows] = await db.query(
      `SELECT DISTINCT p.product_id, p.name, p.price
       FROM products p
       JOIN product_available_colors pac ON p.product_id = pac.product_id
       WHERE pac.color_id IN (?)`,
      [colorIds]
    );
    if (!productRows.length) return res.json([]);

    // 查詢所有圖片、顏色 hex_code
    const result = [];
    for (const prod of productRows) {
      // 所有圖片
      const [imgRows] = await db.query(
        'SELECT image_url FROM product_images WHERE product_id=? ORDER BY id ASC',
        [prod.product_id]
      );
      const images = imgRows.map(row => {
        const filename = path.basename(row.image_url);
        return `/image/itemImage/${filename}`;
      });
      // 取得顏色（只取推薦色）
      const [colorInfo] = await db.query(
        `SELECT c.hex_code, c.name
         FROM product_available_colors pac
         JOIN colors c ON pac.color_id = c.color_id
         WHERE pac.product_id=? AND pac.color_id IN (?)
         LIMIT 1`,
        [prod.product_id, colorIds]
      );
      result.push({
        product_id: prod.product_id,
        name: prod.name,
        images,
        price: prod.price,
        colors: colorInfo.length ? [{ hex_code: colorInfo[0].hex_code, name: colorInfo[0].name }] : []
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 商品搜尋 API
// =============================================
router.get('/api/items/search', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: '缺少 keyword' });
  try {
    // 搜尋分類
    const [catRows] = await db.query('SELECT category_id FROM categories WHERE name LIKE ?', [`%${keyword}%`]);
    let products = [];
    if (catRows.length) {
      // 搜尋季節色彩分類商品
      const catIds = catRows.map(r => r.category_id);
      [products] = await db.query('SELECT * FROM products WHERE category_id IN (?)', [catIds]);
    } else {
      // 搜尋商品名稱
      [products] = await db.query('SELECT * FROM products WHERE name LIKE ?', [`%${keyword}%`]);
    }
    for (const prod of products) {
      // 取得圖片
      const [imgs] = await db.query('SELECT image_url FROM product_images WHERE product_id=?', [prod.product_id]);
      prod.images = imgs.map(i => {
        const filename = require('path').basename(i.image_url);
        // 修正路徑
        return `/image/itemImage/${filename}`;
      });
      // 取得尺寸
      const [szs] = await db.query(
        'SELECT s.name FROM product_available_sizes pas JOIN sizes s ON pas.size_id=s.size_id WHERE pas.product_id=?',
        [prod.product_id]
      );
      prod.sizes = szs.map(s => s.name);
      // 取得顏色
      const [colors] = await db.query(
        'SELECT c.name, c.hex_code, c.color_id FROM product_available_colors pac JOIN colors c ON pac.color_id=c.color_id WHERE pac.product_id=?',
        [prod.product_id]
      );
      prod.colors = colors;
      // 取得庫存
      const [stockRows] = await db.query(
        `SELECT ps.quantity, s.name AS size_name
         FROM product_stock ps
         JOIN sizes s ON ps.size_id = s.size_id
         WHERE ps.product_id=?`,
        [prod.product_id]
      );
      prod.stock = stockRows;
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// --- 待購清單 購物車 ---
// =============================================

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 解析 JWT token，取得 user_id
function getUserIdFromRequest(req) {
  const authHeader = req.headers && req.headers.authorization;
  if (
    authHeader &&
    typeof authHeader === 'string' &&
    authHeader.trim().startsWith('Bearer ') &&
    authHeader.trim().length > 7
  ) {
    const token = authHeader.trim().slice(7).trim();
    if (!token) return 'guest'; // 沒有 token 就回傳 guest
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // Debug: 印出 payload 內容 檢查登入者
      // console.log('JWT payload:', payload);
      return payload.userId || payload.user_id;
    } catch (err) {
      console.error('JWT verify error:', err);
      return 'guest'; // 驗證失敗也回傳 guest
    }
  }
  return 'guest'; // 沒有 Authorization header 就回傳 guest
}

// --- 待購清單 API 端點 ---
router.get('/api/v2/wishlist', async (req, res) => {
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  try {
    const sql = `
      SELECT 
        p.product_id, p.name, p.price,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id ORDER BY id DESC LIMIT 1) AS image_url,
        w.id AS wishlistItemId, w.color_id, w.size_id,
        c.name AS color_name,
        c.hex_code,
        s.name AS size_name,
        (SELECT quantity FROM product_stock WHERE product_id = w.product_id AND color_id = w.color_id AND size_id = w.size_id LIMIT 1) AS stockQuantity
      FROM wishlist_items AS w
      JOIN products AS p ON w.product_id = p.product_id
      JOIN colors AS c ON w.color_id = c.color_id
      JOIN sizes AS s ON w.size_id = s.size_id
      WHERE w.user_id = ?`;
    const [wishlistItems] = await db.query(sql, [userId]);
    res.json({ success: true, message: "成功獲取待購清單", data: wishlistItems });
  } catch (error) {
    // 確保有完整的錯誤處理
    console.error('獲取待購清單時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});
router.post('/api/v2/wishlist', async (req, res) => {
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  const { productId, colorId = 1, sizeId = 1 } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: "缺少商品 ID" });

  try {
    const newItem = {
      id: `wish_${crypto.randomUUID()}`,
      user_id: userId,
      product_id: productId,
      color_id: colorId,
      size_id: sizeId
    };
    const sql = 'INSERT INTO wishlist_items SET ? ON DUPLICATE KEY UPDATE product_id=product_id'; // [cite: 13]
    await db.query(sql, newItem);
    res.status(201).json({ success: true, message: "商品已加入待購清單" });
  } catch (error) {
    console.error('加入待購清單時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

router.delete('/api/v2/wishlist/:wishlistItemId', async (req, res) => {
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  const { wishlistItemId } = req.params;
  try {
    const sql = 'DELETE FROM wishlist_items WHERE id = ? AND user_id = ?'; // [cite: 13]
    const [result] = await db.query(sql, [wishlistItemId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "在待購清單中找不到該商品" });
    }
    res.json({ success: true, message: "商品已從待購清單移除" });
  } catch (error) {
    console.error('從待購清單移除商品時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// --- 購物車 API 端點 ---
// 輔助函式：計算購物車總計
// server.js (修正後的 calculateCartTotalsFromDB 函式)

const calculateCartTotalsFromDB = async (userId) => {
  // ▼▼▼【修改 SQL 查詢，新增 image_url】▼▼▼
  const itemsSQL = `
        SELECT 
            ci.id, 
            ci.quantity,
            ci.product_id,
            ci.color_id,
            ci.size_id,
            p.name AS product_name,
            p.price,
            c.name AS color_name,
            c.hex_code,
            s.name AS size_name,
            (SELECT image_url FROM product_images WHERE product_id = p.product_id ORDER BY id DESC LIMIT 1) AS image_url
        FROM 
            cart_items AS ci
        JOIN 
            products AS p ON ci.product_id = p.product_id
        JOIN 
            colors AS c ON ci.color_id = c.color_id
        JOIN 
            sizes AS s ON ci.size_id = s.size_id
        WHERE 
            ci.user_id = ?`;
  // ▲▲▲【修改 SQL 查詢，新增 image_url】▲▲▲

  const [items] = await db.query(itemsSQL, [userId]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discountAmount = 0;
  const totalAmount = subtotal - discountAmount;

  return { items, subtotal, discountAmount, totalAmount };
};
router.get('/api/v2/cart', async (req, res) => {
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  try {
    const cartData = await calculateCartTotalsFromDB(userId);
    res.json({ success: true, message: "成功獲取購物車內容", data: cartData });
  } catch (error) {
    console.error('獲取購物車時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

router.post('/api/v2/cart/items', async (req, res) => {
  console.log('cart/items header:', req.headers);
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  console.log('userId for cart:', `"${userId}"`, userId.length); // 新增這行

  const { productId, quantity, colorId = 1, sizeId = 1 } = req.body;
  try {
    const findSQL = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND color_id = ? AND size_id = ?';

    // ▼▼▼【修改部分】▼▼▼
    // 1. 安全地接收查詢結果
    const [rows] = await db.query(findSQL, [userId, productId, colorId, sizeId]);
    const existingItem = rows[0]; // 如果沒找到，existingItem 會是 undefined
    // ▲▲▲【修改部分】▲▲▲

    if (existingItem) {
      const updateSQL = 'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?';
      await db.query(updateSQL, [quantity, existingItem.id]);
    } else {
      const newItem = {
        id: `cart_${crypto.randomUUID()}`,
        user_id: userId,
        product_id: productId,
        color_id: colorId,
        size_id: sizeId,
        quantity: quantity
      };
      const insertSQL = 'INSERT INTO cart_items SET ?';
      await db.query(insertSQL, newItem);
    }
    res.status(201).json({ success: true, message: "成功將商品加入購物車" });
  } catch (error) {
    console.error('加入購物車時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

router.patch('/api/v2/cart/items/:cartItemId', async (req, res) => {
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  const { cartItemId } = req.params;
  const { quantity, sizeId } = req.body;

  // 如果有 sizeId，優先更新尺寸
  if (sizeId) {
    try {
      const sql = 'UPDATE cart_items SET size_id = ? WHERE id = ? AND user_id = ?';
      const [result] = await db.query(sql, [sizeId, cartItemId, userId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "在購物車中找不到該商品" });
      }
      // 回傳最新購物車資料
      const cartData = await calculateCartTotalsFromDB(userId);
      return res.json({ success: true, message: "尺寸已更新", data: cartData });
    } catch (error) {
      console.error('更新購物車尺寸時發生錯誤:', error);
      return res.status(500).json({ success: false, message: "伺服器內部錯誤" });
    }
  }

  // 原本的數量更新邏輯
  if (isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) < 1) {
    return res.status(400).json({ success: false, message: "無效的數量" });
  }
  try {
    const sql = 'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?';
    const [result] = await db.query(sql, [quantity, cartItemId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "在購物車中找不到該商品" });
    }
    const cartData = await calculateCartTotalsFromDB(userId);
    res.json({ success: true, message: "數量已更新", data: cartData });
  } catch (error) {
    console.error('更新購物車數量時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});


router.delete('/api/v2/cart/items/:cartItemId', async (req, res) => {
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  const { cartItemId } = req.params;
  try {
    const sql = 'DELETE FROM cart_items WHERE id = ? AND user_id = ?'; // [cite: 11]
    const [result] = await db.query(sql, [cartItemId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "在購物車中找不到該商品" });
    }
    res.json({ success: true, message: "商品已從購物車移除" });
  } catch (error) {
    console.error('從購物車移除商品時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// =============================================
// --- 建立訂單 (綠界整合) ---
// =============================================
router.post('/api/v2/orders', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let cartItems, subtotal, totalAmount;
    const { shippingInfo, cartItems: anonymousCartItems } = req.body;

    // --- 檢查 userId 判斷 ---
    const userId = getUserIdFromRequest(req);
    console.log('[訂單] userId:', userId);
    console.log('[訂單] headers:', req.headers);
    console.log('[訂單] body:', req.body);

    // --- 修正：匿名結帳 cartItems 來源 ---
    // anonymousCartItems 可能是 undefined/null，但 req.body.cartItems 可能是空陣列或物件
    // 這裡強制轉成陣列
    const isLoggedIn = userId !== 'guest';

    if (isLoggedIn) {
      console.log('已登入使用者，從資料庫讀取購物車...');
      const cartResult = await calculateCartTotalsFromDB(userId);
      if (cartResult.items.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "購物車是空的" });
      }
      cartItems = cartResult.items;
      subtotal = cartResult.subtotal;
      totalAmount = cartResult.totalAmount;
    } else {
      // 匿名結帳流程
      // 修正：cartItems 來源
      let items = Array.isArray(anonymousCartItems)
        ? anonymousCartItems
        : (anonymousCartItems && typeof anonymousCartItems === 'object' && anonymousCartItems.items)
          ? anonymousCartItems.items
          : [];
      // 如果 items 還是空，嘗試直接用 req.body.cartItems
      if (!items.length && Array.isArray(req.body.cartItems)) {
        items = req.body.cartItems;
      }
      if (!items.length) {
        console.log('[訂單] 匿名結帳 cartItems 為空:', items);
        await connection.rollback();
        return res.status(400).json({ success: false, message: "購物車是空的" });
      }
      cartItems = items;
      let recalculatedSubtotal = 0;
      for (const item of cartItems) {
        if (!item.productId && !item.product_id) {
          console.log('[訂單] 匿名商品缺少 productId:', item);
          continue;
        }
        const [productRows] = await connection.query('SELECT price FROM products WHERE product_id = ?', [item.productId || item.product_id]);
        if (productRows.length > 0) {
          recalculatedSubtotal += Number(productRows[0].price) * Number(item.quantity);
        }
      }
      subtotal = recalculatedSubtotal;
      totalAmount = recalculatedSubtotal;
    }

    // --- 修正的核心邏輯開始 ---
    function generateOrderId() {
      // 產生 6 碼英數亂碼
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      // 取得日期（yyMMdd 格式）
      const now = new Date();
      const dateStr = String(now.getFullYear()).slice(2, 4) +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      // 組合
      return rand + dateStr;
    }
    // 1. 先產生並儲存這次訂單要使用的 order_id 和 tradeNo
    // const newOrderId = crypto.randomUUID();
    // 改成 12 碼英數字串
    const newOrderId = generateOrderId();

    const tradeNo = `ECPAY${new Date().getTime()}`;

    // 2. 建立 orders 資料表的 INSERT 語句和對應的值
    // 修正：未登入時 user_id 改為 'guest'
    const insertOrderSql = `
            INSERT INTO orders (
                order_id, user_id, order_date, status, 
                recipient_last_name, recipient_first_name, 
                recipient_phone, shipping_address, 
                postal_code, payment_method, 
                subtotal, discount_amount, total_amount, 
                ecpay_merchant_trade_no
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const insertOrderValues = [
      newOrderId,
      isLoggedIn ? userId : 'guest',
      new Date(),
      'pending_payment',
      shippingInfo.lastName,
      shippingInfo.firstName,
      shippingInfo.phone,
      shippingInfo.address,
      shippingInfo.postalCode || '',
      '信用卡',
      subtotal,
      0,
      totalAmount,
      tradeNo
    ];
    await connection.query(insertOrderSql, insertOrderValues);

    // 3. 準備 order_items 的資料 (使用 newOrderId)
    const orderItems = cartItems.map(item => [
      newOrderId,
      item.productId || item.product_id,
      item.name || item.product_name,
      item.size_name,
      item.color_name,
      item.price,
      item.quantity
    ]);
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity) VALUES ?',
      [orderItems]
    );

    // --- 修正的核心邏輯結束 ---

    if (isLoggedIn) {
      await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    }

    await connection.commit();

    // 5. 產生綠界支付表單 (這部分綠界邏輯保持不變)
    const merchantID = '2000132';
    const hashKey = '5294y06JbISPM5x9';
    const hashIV = 'v77hoKGq4kWxNNIS';
    const ecpayURL = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

    const itemNames = cartItems.map(item => `${item.name || item.product_name} x ${item.quantity}`).join('#');

    // --- 修正：補上 ReturnURL 變數 ---
    const ReturnURL = 'https://48edd3be4ba6.ngrok-free.app';

    let orderParams = {
      MerchantID: merchantID,
      MerchantTradeNo: tradeNo,
      MerchantTradeDate: new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/'),
      PaymentType: 'aio',
      ChoosePayment: 'ALL',
      TotalAmount: totalAmount,
      TradeDesc: '網路商店線上購物',
      ItemName: itemNames,
      ReturnURL: ReturnURL, // 後端接收網址
      OrderResultURL: `${ReturnURL}/ecpay-return`, // 指向新的後端路由
      CustomField1: newOrderId,
      EncryptType: 1,
    };


    const sortedKeys = Object.keys(orderParams).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    let checkString = `HashKey=${hashKey}`;
    for (const key of sortedKeys) { checkString += `&${key}=${orderParams[key]}`; }
    checkString += `&HashIV=${hashIV}`;
    const urlEncodedString = encodeURIComponent(checkString).replace(/%20/g, '+').replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2a').toLowerCase();
    const checkMacValue = crypto.createHash('sha256').update(urlEncodedString).digest('hex').toUpperCase();
    orderParams.CheckMacValue = checkMacValue;

    let htmlForm = `<form id="ecpay-form" method="POST" action="${ecpayURL}" style="display:none;">`;
    for (const key in orderParams) { htmlForm += `<input type="hidden" name="${key}" value="${orderParams[key]}" />`; }
    htmlForm += `</form><script>document.getElementById("ecpay-form").submit();</script>`;
    res.send(htmlForm);

  } catch (error) {
    console.error('[訂單] catch error:', error);
    await connection.rollback();
    res.status(500).send("建立訂單失敗: " + error.message);
  } finally {
    if (connection) connection.release();
  }
});
// --- 接收綠界通知 & 查詢訂單 ---
router.post('/api/payment-result', async (req, res) => {
  const { MerchantTradeNo, RtnCode } = req.body;
  console.log(`收到綠界後端通知: TradeNo=${MerchantTradeNo}, RtnCode=${RtnCode}`);
  try {
    if (RtnCode === '1') {
      const sql = "UPDATE orders SET status = 'processing' WHERE ecpay_merchant_trade_no = ? AND status = 'pending_payment'"; // [cite: 14]
      await db.query(sql, [MerchantTradeNo]);
      console.log(`訂單 ${MerchantTradeNo} 狀態已更新為處理中。`);
    } else {
      const sql = "UPDATE orders SET status = 'failed' WHERE ecpay_merchant_trade_no = ?";[cite_start]// [cite: 14]
      await db.query(sql, [MerchantTradeNo]);
      console.log(`訂單 ${MerchantTradeNo} 狀態更新為失敗。`);
    }
    res.send('1|OK');
  } catch (error) {
    console.error('更新訂單狀態時發生錯誤:', error);
    res.status(500).send('0|ERROR');
  }
});

router.get('/api/v2/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  // 取得 userId（登入才有）
  const userId = getUserIdFromRequest(req);
  console.log('查詢訂單 userId:', userId); // 新增這行，方便 debug

  try {
    // 查詢訂單
    const orderSQL = 'SELECT * FROM orders WHERE order_id = ?';
    const [[order]] = await db.query(orderSQL, [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: "找不到指定的訂單" });
    }

    // --- 修正：驗證 userId 是否有權限 ---
    if (order.user_id !== 'guest' && userId && order.user_id !== userId) {
      return res.status(401).json({ success: false, message: "無權限查詢此訂單" });
    }

    // --- 移除 shippingAddress 欄位 ---
    if (order.shippingAddress) {
      delete order.shippingAddress;
    }
    // 如果是多個欄位（recipientName, phone, address, postalCode），也可逐一刪除
    delete order.recipientName;
    delete order.recipientPhone;
    delete order.recipientAddress;
    delete order.recipientPostalCode;

    // 查詢訂單商品
    const itemsSQL = `
      SELECT 
        oi.*, 
        (
          SELECT image_url 
          FROM product_images 
          WHERE product_id = oi.product_id 
          ORDER BY id DESC LIMIT 1
        ) AS image_url
      FROM order_items AS oi
      WHERE oi.order_id = ?
    `;
    const [items] = await db.query(itemsSQL, [orderId]);
    for (const item of items) {
      if (item.image_url) {
        const filename = require('path').basename(item.image_url);
        item.image_url = `/image/itemImage/${filename}`;
      }
    }
    order.items = items;

    res.json({ success: true, message: "成功獲取訂單資料", data: order });
  } catch (error) {
    console.error('查詢訂單時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// =============================================
// 查詢所有訂單（Order 列表用）
// =============================================
router.get('/api/v2/orders', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY order_date DESC');
    res.json({ success: true, message: "成功獲取訂單列表", data: orders });
  } catch (error) {
    console.error('查詢訂單列表時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// --- 只保留 /ecpay-return 在根目錄 ---
router.post('/ecpay-return', (req, res) => {
  // 綠界會將交易結果用 POST 方法送到這個路由
  // 並且我們在 CustomField1 中夾帶的 orderId 也會一併回來
  const { RtnCode, MerchantTradeNo, CustomField1 } = req.body;
  const orderId = CustomField1;

  console.log(`收到綠界前端返回通知: TradeNo=${MerchantTradeNo}, RtnCode=${RtnCode}, OrderId=${orderId}`);

  // 不論成功或失敗，都將使用者重新導向到前端的成功頁面
  // 並將訂單 ID 透過 URL 查詢參數傳遞
  res.redirect(`http://localhost:5173/checkout-success?orderId=${orderId}`);
});

// checkout-success GET 路由：回傳訂單 JSON 資料
router.get('/checkout-success', async (req, res) => {
  const orderId = req.query.orderId || '';
  if (!orderId) return res.status(400).json({ error: '缺少 orderId' });

  try {
    const orderSQL = 'SELECT * FROM orders WHERE order_id = ?';
    const [[order]] = await db.query(orderSQL, [orderId]);
    if (!order) return res.status(404).json({ error: '找不到訂單' });

    // 查詢訂單商品
    const itemsSQL = `
      SELECT 
        oi.*, 
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY id DESC LIMIT 1) AS image_url
      FROM order_items AS oi
      WHERE oi.order_id = ?
    `;
    const [items] = await db.query(itemsSQL, [orderId]);
    for (const item of items) {
      if (item.image_url) {
        const filename = require('path').basename(item.image_url);
        item.image_url = `/image/itemImage/${filename}`;
      }
    }

    // 組合回傳物件，只回傳必要欄位
    const result = {
      order_id: order.order_id,
      user_id: order.user_id,
      order_date: order.order_date,
      status: order.status,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      total_amount: order.total_amount,
      ecpay_merchant_trade_no: order.ecpay_merchant_trade_no,
      updated_at: order.updated_at,
      items: items
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 依商品ID查詢所有顏色/尺寸的庫存
// =============================================
router.get('/api/product_stock_by_product_id', async (req, res) => {
  const { product_id } = req.query;
  if (!product_id) return res.status(400).json({ error: '缺少 product_id' });
  try {
    const [rows] = await db.query(
      `SELECT color_id, size_id, quantity FROM product_stock WHERE product_id=?`,
      [product_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// 套用購物車折扣碼
// =============================================
router.post('/api/v2/cart/discount', async (req, res) => {
  const userId = getUserIdFromRequest(req) || MOCK_USER_ID;
  const { discountCode } = req.body;
  if (!discountCode) return res.status(400).json({ success: false, message: '缺少折扣碼' });
  try {
    // 查詢折扣碼
    const [discountRows] = await db.query(
      `SELECT discount_id, code, description, expiry_date, is_active FROM discounts WHERE code = ? AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date >= CURDATE())`,
      [discountCode]
    );
    if (!discountRows.length) {
      return res.status(400).json({ success: false, message: '折扣碼無效或已過期' });
    }
    const discount = discountRows[0];
    // 插入 cart_discounts（如已存在則更新 applied_at）
    await db.query(
      `INSERT INTO cart_discounts (user_id, discount_id, applied_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE applied_at = NOW(), discount_id = VALUES(discount_id)`,
      [userId, discount.discount_id]
    );
    // 重新計算購物車金額
    const cartData = await calculateCartTotalsFromDB(userId);
    // 滿 500 打 8 折
    let discountAmount = 0;
    if (cartData.subtotal >= 500) {
      discountAmount = Math.round(cartData.subtotal * 0.2);
    }
    cartData.discount = {
      amount: discountAmount,
      message: discount.description || discount.code
    };
    cartData.totalAmount = Math.max(0, cartData.subtotal - discountAmount);
    res.json({ success: true, message: '折扣碼已套用', data: cartData });
  } catch (error) {
    console.error('套用折扣碼時發生錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器內部錯誤' });
  }
});

// 以下是後台網頁操作的 API
// =============================================
// 管理者查詢指定訂單（不檢查 user_id）
// =============================================
router.get('/api/v2/admin/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const orderSQL = 'SELECT * FROM orders WHERE order_id = ?';
    const [[order]] = await db.query(orderSQL, [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: "找不到指定的訂單" });
    }
    // 查詢訂單商品
    const itemsSQL = `
      SELECT 
        oi.*, 
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY id DESC LIMIT 1) AS image_url
      FROM order_items AS oi
      WHERE oi.order_id = ?
    `;
    const [items] = await db.query(itemsSQL, [orderId]);
    for (const item of items) {
      if (item.image_url) {
        const filename = require('path').basename(item.image_url);
        item.image_url = `/image/itemImage/${filename}`;
      }
    }
    order.items = items;
    res.json({ success: true, message: "成功獲取訂單資料", data: order });
  } catch (error) {
    console.error('管理者查詢訂單時發生錯誤:', error);
    res.status(500).json({ success: false, message: "伺服器內部錯誤" });
  }
});

// =============================================
// 退換貨申請 API
// =============================================
const { v4: uuidv4 } = require('uuid');

// 查詢所有退換貨申請
router.get('/api/v2/order_returns', async (req, res) => {
  try {
    const [returns] = await db.query('SELECT * FROM order_returns ORDER BY request_date DESC');
    res.json({ success: true, data: returns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查詢單一退換貨申請（含明細、物流）
router.get('/api/v2/order_returns/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[ret]] = await db.query('SELECT * FROM order_returns WHERE return_id=?', [id]);
    if (!ret) return res.status(404).json({ error: '找不到退換貨申請' });
    const [items] = await db.query('SELECT * FROM order_return_items WHERE return_id=?', [id]);
    const [shipments] = await db.query('SELECT * FROM order_return_shipments WHERE return_id=?', [id]);
    ret.items = items;
    ret.shipments = shipments;
    res.json({ success: true, data: ret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 建立退換貨申請（含明細、物流）
router.post('/api/v2/order_returns', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const {
      order_id, user_id, type, reason, admin_note, items = [], shipment = {}
    } = req.body;
    const return_id = uuidv4();
    await conn.query(
      `INSERT INTO order_returns (
        return_id, order_id, user_id, request_date, type, status, reason, admin_note, created_at, updated_at
      ) VALUES (?, ?, ?, NOW(), ?, 'pending', ?, ?, NOW(), NOW())`,
      [return_id, order_id, user_id, type, reason, admin_note]
    );
    for (const item of items) {
      await conn.query(
        `INSERT INTO order_return_items (
          return_id, order_item_id, product_id, size, color, quantity, reason, exchange_to_size, exchange_to_color, processed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          return_id,
          item.order_item_id,
          item.product_id,
          item.size,
          item.color,
          item.quantity,
          item.reason || '',
          item.exchange_to_size || '',
          item.exchange_to_color || '',
          item.processed || 0
        ]
      );
    }
    if (shipment && shipment.courier) {
      await conn.query(
        `INSERT INTO order_return_shipments (
          shipment_id, return_id, shipment_type, courier, tracking_number, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [uuidv4(), return_id, shipment.shipment_type || 'customer_send', shipment.courier, shipment.tracking_number, shipment.status || 'created']
      );
    }
    await conn.commit();
    res.status(201).json({ success: true, return_id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.patch('/api/v2/order_returns/:id', async (req, res) => {
  const { id } = req.params;
  const {
    type, reason, admin_note, items = [], shipment = {}
  } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE order_returns SET type=?, reason=?, admin_note=?, updated_at=NOW() WHERE return_id=?`,
      [type, reason, admin_note, id]
    );
    await conn.query('DELETE FROM order_return_items WHERE return_id=?', [id]);
    for (const item of items) {
      await conn.query(
        `INSERT INTO order_return_items (
          return_id, order_item_id, product_id, size, color, quantity, reason, exchange_to_size, exchange_to_color, processed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.order_item_id,
          item.product_id,
          item.size,
          item.color,
          item.quantity,
          item.reason || '',
          item.exchange_to_size || '',
          item.exchange_to_color || '',
          item.processed || 0
        ]
      );
    }
    await conn.query('DELETE FROM order_return_shipments WHERE return_id=?', [id]);
    if (shipment && shipment.courier) {
      await conn.query(
        `INSERT INTO order_return_shipments (
          shipment_id, return_id, shipment_type, courier, tracking_number, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [uuidv4(), id, shipment.shipment_type || 'customer_send', shipment.courier, shipment.tracking_number, shipment.status || 'created']
      );
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;