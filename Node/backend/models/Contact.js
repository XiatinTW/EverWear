const { query, transaction } = require('../config/database');
const crypto = require('crypto');

const ContactModel = {
  // 建立新的聯絡主題
  createThread: async function(threadData) {
    const { userId, subject } = threadData;
    const contactId = crypto.randomUUID();
    
    const result = await query(
      `INSERT INTO contact_threads (contact_id, user_id, title, has_unread, created_at, updated_at) 
       VALUES (?, ?, ?, 0, NOW(), NOW())`,
      [contactId, userId, subject]
    );
    
    return contactId;
  },

  // 新增訊息到聊天串
  addMessage: async function(messageData) {
    const { threadId, senderId, content } = messageData;
    const messageId = crypto.randomUUID();
    
    return await transaction(async (connection) => {
      // 新增訊息
      await connection.execute(
        `INSERT INTO contact_messages (message_id, contact_id, sender_id, content, creation_date) 
         VALUES (?, ?, ?, ?, NOW())`,
        [messageId, threadId, senderId, content]
      );

      // 更新聊天串的最後更新時間
      await connection.execute(
        'UPDATE contact_threads SET updated_at = NOW() WHERE contact_id = ?',
        [threadId]
      );

      return messageId;
    });
  },

  // 獲取用戶的聊天串列表
  getUserThreads: async function(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const threads = await query(
      `SELECT ct.contact_id as id, ct.title as subject, ct.has_unread, ct.created_at, ct.updated_at,
              (SELECT COUNT(*) FROM contact_messages cm WHERE cm.contact_id = ct.contact_id) as message_count,
              (SELECT cm.content FROM contact_messages cm WHERE cm.contact_id = ct.contact_id ORDER BY cm.creation_date DESC LIMIT 1) as last_message
       FROM contact_threads ct 
       WHERE ct.user_id = ? 
       ORDER BY ct.updated_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM contact_threads WHERE user_id = ?',
      [userId]
    );

    return {
      threads,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.total / limit)
    };
  },

  // 獲取特定聊天串的詳細資訊
  getThreadById: async function(threadId, userId = null) {
    const whereClause = userId ? 'WHERE ct.contact_id = ? AND ct.user_id = ?' : 'WHERE ct.contact_id = ?';
    const params = userId ? [threadId, userId] : [threadId];
    
    const threads = await query(
      `SELECT ct.contact_id as id, ct.title as subject, ct.has_unread, ct.created_at, ct.updated_at,
              u.username, u.email, u.first_name, u.last_name
       FROM contact_threads ct
       LEFT JOIN users u ON ct.user_id = u.user_id
       ${whereClause}`,
      params
    );

    return threads[0] || null;
  },

  // 獲取聊天串的所有訊息
  getThreadMessages: async function(threadId, userId = null) {
    // 先檢查用戶是否有權限查看此聊天串
    if (userId) {
      const thread = await this.getThreadById(threadId, userId);
      if (!thread) {
        throw new Error('找不到聊天串或無權限查看');
      }
    }

    const messages = await query(
      `SELECT cm.message_id as id, cm.sender_id, cm.content, cm.creation_date as created_at,
              u.username as sender_name
       FROM contact_messages cm
       LEFT JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.contact_id = ?
       ORDER BY cm.creation_date ASC`,
      [threadId]
    );

    return messages;
  },

  // 更新聊天串狀態
  updateThreadStatus: async function(threadId, status) {
    await query(
      'UPDATE contact_threads SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, threadId]
    );
  },

  // 獲取所有聊天串（管理員用）
  getAllThreads: async function(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    if (filters.status) {
      whereConditions.push('ct.status = ?');
      params.push(filters.status);
    }

    if (filters.category) {
      whereConditions.push('ct.category = ?');
      params.push(filters.category);
    }

    if (filters.priority) {
      whereConditions.push('ct.priority = ?');
      params.push(filters.priority);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const threads = await query(
      `SELECT ct.*, u.username, u.email, u.first_name, u.last_name,
              (SELECT COUNT(*) FROM contact_messages cm WHERE cm.contact_id = ct.contact_id) as message_count
       FROM contact_threads ct
       LEFT JOIN users u ON ct.user_id = u.user_id
       ${whereClause}
       ORDER BY ct.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countQuery = `SELECT COUNT(*) as total FROM contact_threads ct ${whereClause}`;
    const [countResult] = await query(countQuery, params);

    return {
      threads,
      total: countResult.total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.total / limit)
    };
  }
};

module.exports = { ContactModel };
