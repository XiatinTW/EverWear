const { ContactModel } = require('../models/Contact');
const { successResponse, errorResponse, calculatePagination } = require('../utils/helpers');

const ContactController = {
  // 建立新的聯絡主題
  createThread: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { subject, content } = req.body;

      // 輸入驗證
      if (!subject || !content) {
        return res.status(400).json(errorResponse('請填寫主題和內容'));
      }

      // 建立聊天串
      const threadId = await ContactModel.createThread({
        userId,
        subject: subject.trim()
      });

      // 新增第一條訊息
      await ContactModel.addMessage({
        threadId,
        senderId: userId,
        content: content.trim()
      });

      // 獲取完整的聊天串資訊
      const thread = await ContactModel.getThreadById(threadId, userId);

      res.status(201).json(successResponse({
        threadId: thread.id,
        subject: thread.subject,
        createdAt: thread.created_at
      }, '聯絡主題建立成功'));

    } catch (error) {
      next(error);
    }
  },

  // 獲取用戶的聊天串列表
  getUserThreads: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await ContactModel.getUserThreads(userId, parseInt(page), parseInt(limit));

      const pagination = calculatePagination(page, limit, result.total);

      res.json(successResponse({
        threads: result.threads.map(thread => ({
          id: thread.id,
          subject: thread.subject,
          hasUnread: thread.has_unread,
          messageCount: thread.message_count,
          lastMessage: thread.last_message,
          createdAt: thread.created_at,
          updatedAt: thread.updated_at
        })),
        pagination
      }));

    } catch (error) {
      next(error);
    }
  },

  // 獲取特定聊天串的詳細資訊
  getThread: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json(errorResponse('請提供聊天串 ID'));
      }

      const thread = await ContactModel.getThreadById(id, userId);
      if (!thread) {
        return res.status(404).json(errorResponse('找不到聊天串'));
      }

      res.json(successResponse({
        id: thread.id,
        subject: thread.subject,
        hasUnread: thread.has_unread,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at
      }));

    } catch (error) {
      next(error);
    }
  },

  // 獲取聊天串的所有訊息
  getThreadMessages: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json(errorResponse('請提供聊天串 ID'));
      }

      const thread = await ContactModel.getThreadById(id, userId);
      const messages = await ContactModel.getThreadMessages(id, userId);

      res.json(successResponse({
        thread: {
          id: thread.id,
          subject: thread.subject,
          hasUnread: thread.has_unread,
          createdAt: thread.created_at,
          updatedAt: thread.updated_at
        },
        messages: messages.map(message => ({
          id: message.id,
          sender: message.sender_id === userId ? 'user' : 'admin',
          content: message.content,
          sentAt: message.created_at
        }))
      }));

    } catch (error) {
      next(error);
    }
  },

  // 回覆聊天串
  replyToThread: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { content } = req.body;

      if (!id) {
        return res.status(400).json(errorResponse('請提供聊天串 ID'));
      }

      if (!content || !content.trim()) {
        return res.status(400).json(errorResponse('回覆內容不能為空'));
      }

      // 檢查聊天串是否存在且屬於當前用戶
      const thread = await ContactModel.getThreadById(id, userId);
      if (!thread) {
        return res.status(404).json(errorResponse('找不到聊天串'));
      }

      // 新增回覆訊息
      const messageId = await ContactModel.addMessage({
        threadId: id,
        senderId: userId,
        content: content.trim()
      });

      res.status(201).json(successResponse({
        messageId,
        content: content.trim(),
        createdAt: new Date().toISOString()
      }, '回覆已發送'));

    } catch (error) {
      next(error);
    }
  },

  // 關閉聊天串
  closeThread: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json(errorResponse('無效的聊天串 ID'));
      }

      // 檢查聊天串是否存在且屬於當前用戶
      const thread = await ContactModel.getThreadById(parseInt(id), userId);
      if (!thread) {
        return res.status(404).json(errorResponse('找不到聊天串'));
      }

      if (thread.status === 'closed') {
        return res.status(400).json(errorResponse('聊天串已經關閉'));
      }

      // 更新狀態為關閉
      await ContactModel.updateThreadStatus(parseInt(id), 'closed');

      res.json(successResponse(null, '聊天串已關閉'));

    } catch (error) {
      next(error);
    }
  },

  // 重新開啟聊天串
  reopenThread: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json(errorResponse('無效的聊天串 ID'));
      }

      // 檢查聊天串是否存在且屬於當前用戶
      const thread = await ContactModel.getThreadById(parseInt(id), userId);
      if (!thread) {
        return res.status(404).json(errorResponse('找不到聊天串'));
      }

      if (thread.status === 'open') {
        return res.status(400).json(errorResponse('聊天串已經是開啟狀態'));
      }

      // 更新狀態為開啟
      await ContactModel.updateThreadStatus(parseInt(id), 'open');

      res.json(successResponse(null, '聊天串已重新開啟'));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { ContactController };
