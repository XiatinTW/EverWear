const { query } = require('../config/database');
const { successResponse, errorResponse, calculatePagination } = require('../utils/helpers');
const jwt = require('jsonwebtoken'); // 新增

const OrderController = {
  // 獲取用戶的訂單列表
  getUserOrders: async function(req, res, next) {
    try {
      // 取得 JWT token
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
      // 解析 user_id
      let parsedUserId = null;
      if (token) {
        try {
          const decoded = jwt.decode(token);
          parsedUserId = decoded && decoded.userId;
        } catch (e) {
          parsedUserId = null;
        }
      }

      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      let whereConditions = ['user_id = ?'];
      let params = [userId];

      if (status) {
        whereConditions.push('status = ?');
        params.push(status);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // 獲取訂單列表
      const orders = await query(
        `SELECT order_id as id, status, total_amount, order_date as created_at, updated_at
         FROM orders 
         WHERE ${whereClause}
         ORDER BY order_date DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      // 為每個訂單獲取訂單項目
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        // 查詢訂單項目並連接商品圖片（只取第一張）
        const orderItems = await query(
          `SELECT oi.id, oi.product_id, oi.product_name as name, oi.size, oi.color, oi.price, oi.quantity,
                  (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY id DESC LIMIT 1) AS image_url
           FROM order_items oi
           WHERE oi.order_id = ?`,
          [order.id]
        );

        return {
          id: order.id,
          orderNumber: order.id,
          status: order.status,
          totalAmount: parseFloat(order.total_amount),
          currency: 'TWD',
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          orderDate: new Date(order.created_at).toISOString().split('T')[0], // 格式化日期
          orderItems: orderItems.map(item => {
            let imgPath = item.image_url
              ? item.image_url.replace(/^\/assets/, '/image')
              : '/image/itemImage/logo.png';
            return {
              id: item.id,
              productId: item.product_id,
              name: item.name,
              size: item.size,
              color: item.color,
              price: parseFloat(item.price),
              quantity: item.quantity,
              image: imgPath // 修正路徑
            };
          })
        };
      }));

      // 獲取總數
      const [countResult] = await query(
        `SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`,
        params
      );

      const pagination = calculatePagination(page, limit, countResult.total);

      res.json(successResponse({
        orders: ordersWithItems,
        pagination
      }));

    } catch (error) {
      next(error);
    }
  },

  // 獲取特定訂單詳情
  getOrderById: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json(errorResponse('無效的訂單 ID'));
      }

      // 獲取訂單基本資訊
      const orders = await query(
        `SELECT o.*, u.email, u.first_name, u.last_name
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.user_id
         WHERE o.order_id = ? AND o.user_id = ?`,
        [id, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json(errorResponse('找不到訂單'));
      }

      const order = orders[0];

      // 獲取訂單項目
      const orderItems = await query(
        `SELECT oi.*
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [id]
      );

      res.json(successResponse({
        id: order.order_id,
        orderNumber: order.order_id,
        status: order.status,
        totalAmount: parseFloat(order.total_amount),
        subtotal: parseFloat(order.subtotal),
        discountAmount: parseFloat(order.discount_amount || 0),
        currency: 'TWD',
        paymentMethod: order.payment_method,
        shippingAddress: {
          recipientName: (order.recipient_first_name || '') + ' ' + (order.recipient_last_name || ''),
          phone: order.recipient_phone,
          address: order.shipping_address,
          postalCode: order.postal_code
        },
        items: orderItems.map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          totalPrice: parseFloat(item.price) * item.quantity
        })),
        createdAt: order.order_date,
        updatedAt: order.updated_at
      }));

    } catch (error) {
      next(error);
    }
  },

  // 取消訂單
  cancelOrder: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return res.status(400).json(errorResponse('無效的訂單 ID'));
      }

      // 檢查訂單是否存在且屬於當前用戶
      const orders = await query(
        'SELECT order_id, status FROM orders WHERE order_id = ? AND user_id = ?',
        [id, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json(errorResponse('找不到訂單'));
      }

      const order = orders[0];

      // 檢查訂單狀態是否可以取消
      if (!['pending_payment', 'processing'].includes(order.status)) {
        return res.status(400).json(errorResponse('此訂單無法取消'));
      }

      // 更新訂單狀態為已取消
      await query(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        ['cancelled', id]
      );

      res.json(successResponse(null, '訂單已成功取消'));

    } catch (error) {
      next(error);
    }
  },

  // 獲取訂單狀態統計
  getOrderStats: async function(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await query(
        `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_amount
         FROM orders 
         WHERE user_id = ? 
         GROUP BY status`,
        [userId]
      );

      const totalOrders = await query(
        'SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as total_spent FROM orders WHERE user_id = ?',
        [userId]
      );

      res.json(successResponse({
        byStatus: stats.map(stat => ({
          status: stat.status,
          count: stat.count,
          totalAmount: parseFloat(stat.total_amount)
        })),
        overall: {
          totalOrders: totalOrders[0].total,
          totalSpent: parseFloat(totalOrders[0].total_spent)
        }
      }));

    } catch (error) {
      next(error);
    }
  }
};

// 所有 API 都會用 req.user.id 取得 userId
module.exports = { OrderController };
