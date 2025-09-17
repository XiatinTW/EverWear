const { UserModel } = require('../models/User');
const { validateEmail, validatePhone, validatePassword } = require('../middleware/validation');
const { successResponse, errorResponse } = require('../utils/helpers');

const UserController = {
  // 獲取當前用戶資料
  getProfile: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json(errorResponse('用戶不存在'));
      }

      res.json(successResponse({
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        birth_day: user.birth_day,
        address: user.address,
        google_id: user.google_id,
        password_hash: user.password_hash ? 'exists' : null, // 不返回實際密碼，只告知是否存在
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

    } catch (error) {
      next(error);
    }
  },

  // 更新用戶資料
  updateProfile: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { username, first_name, last_name, birth_day, address, phone } = req.body;

      // 建立更新數據對象
      const updateData = {};

      if (username !== undefined) {
        if (!username.trim()) {
          return res.status(400).json(errorResponse('用戶名不能為空'));
        }
        
        // 檢查用戶名是否已被其他用戶使用
        const usernameExists = await UserModel.usernameExists(username, userId);
        if (usernameExists) {
          return res.status(400).json(errorResponse('此用戶名已被使用'));
        }
        
        updateData.username = username.trim();
      }

      if (first_name !== undefined) {
        if (!first_name.trim()) {
          return res.status(400).json(errorResponse('名字不能為空'));
        }
        updateData.first_name = first_name.trim();
      }

      if (last_name !== undefined) {
        if (!last_name.trim()) {
          return res.status(400).json(errorResponse('姓氏不能為空'));
        }
        updateData.last_name = last_name.trim();
      }

      if (phone !== undefined) {
        if (phone && !validatePhone(phone)) {
          return res.status(400).json(errorResponse('請輸入有效的電話號碼'));
        }
        updateData.phone = phone || null;
      }

      if (birth_day !== undefined) {
        if (birth_day) {
          // 直接使用輸入的日期字符串，避免時區轉換問題
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(birth_day)) {
            return res.status(400).json(errorResponse('請輸入有效的出生日期格式（YYYY-MM-DD）'));
          }
          
          const date = new Date(birth_day + 'T00:00:00');
          if (isNaN(date.getTime())) {
            return res.status(400).json(errorResponse('請輸入有效的出生日期'));
          }
          
          // 檢查年齡合理性（13-120歲）
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          const monthDiff = today.getMonth() - date.getMonth();
          const dayDiff = today.getDate() - date.getDate();
          
          // 如果還沒到生日，年齡減1
          const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
          
          if (actualAge < 13 || actualAge > 120) {
            return res.status(400).json(errorResponse('請輸入合理的出生日期（年齡需在13-120歲之間）'));
          }
          
          // 直接使用原始日期字符串，避免時區轉換
          updateData.birth_day = birth_day;
        } else {
          updateData.birth_day = null;
        }
      }

      if (address !== undefined) {
        updateData.address = address ? address.trim() : null;
      }

      // 檢查是否有可更新的欄位
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json(errorResponse('沒有提供可更新的資料'));
      }

      // 更新用戶資料
      const updatedUser = await UserModel.updateProfile(userId, updateData);

      res.json(successResponse({
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        birth_day: updatedUser.birth_day,
        address: updatedUser.address,
        email_verified: updatedUser.email_verified,
        updated_at: updatedUser.updated_at
      }, '用戶資料更新成功'));

    } catch (error) {
      next(error);
    }
  },

  // 更新密碼
  updatePassword: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json(errorResponse('請提供新密碼'));
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json(errorResponse('新密碼必須至少包含 8 個字符，包括大小寫字母和數字'));
      }

      // 獲取當前用戶
      const user = await UserModel.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json(errorResponse('用戶不存在'));
      }

      // 檢查是否為 Google 註冊用戶（沒有密碼）
      const isGoogleUser = user.google_id && !user.password_hash;
      
      if (isGoogleUser && !currentPassword) {
        // Google 用戶第一次設定密碼，不需要驗證舊密碼
        await UserModel.updatePassword(userId, newPassword);
        return res.json(successResponse(null, '密碼設定成功！您現在可以使用密碼登入了'));
      }
      
      // 一般用戶或已有密碼的用戶，需要驗證當前密碼
      if (!currentPassword) {
        return res.status(400).json(errorResponse('請提供當前密碼'));
      }

      // 驗證當前密碼
      const validatedUser = await UserModel.validatePassword(user.email, currentPassword);
      if (!validatedUser) {
        return res.status(400).json(errorResponse('當前密碼錯誤'));
      }

      // 檢查新密碼是否與當前密碼相同
      if (currentPassword === newPassword) {
        return res.status(400).json(errorResponse('新密碼不能與當前密碼相同'));
      }

      // 更新密碼
      await UserModel.updatePassword(userId, newPassword);

      res.json(successResponse(null, '密碼更新成功'));

    } catch (error) {
      next(error);
    }
  },

  // 更新電子郵件
  updateEmail: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { newEmail, password } = req.body;

      if (!newEmail || !password) {
        return res.status(400).json(errorResponse('請提供新的電子郵件和密碼'));
      }

      if (!validateEmail(newEmail)) {
        return res.status(400).json(errorResponse('請輸入有效的電子郵件地址'));
      }

      // 檢查新郵箱是否與當前郵箱相同
      if (newEmail === req.user.email) {
        return res.status(400).json(errorResponse('新的電子郵件不能與當前電子郵件相同'));
      }

      // 驗證密碼
      const validatedUser = await UserModel.validatePassword(req.user.email, password);
      if (!validatedUser) {
        return res.status(400).json(errorResponse('密碼錯誤'));
      }

      // 檢查新郵箱是否已被使用
      const emailExists = await UserModel.emailExists(newEmail);
      if (emailExists) {
        return res.status(400).json(errorResponse('此電子郵件已被註冊'));
      }

      // TODO: 發送驗證郵件到新郵箱
      // 暫時直接更新（實際應該先發驗證郵件）
      
      res.json(successResponse({
        message: '郵箱更新請求已提交，請檢查新郵箱並完成驗證',
        newEmail
      }));

    } catch (error) {
      next(error);
    }
  },

  // 刪除帳號
  deleteAccount: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const { password, confirmDeletion } = req.body;

      if (!password) {
        return res.status(400).json(errorResponse('請提供密碼以確認刪除帳號'));
      }

      if (confirmDeletion !== 'DELETE_MY_ACCOUNT') {
        return res.status(400).json(errorResponse('請輸入 "DELETE_MY_ACCOUNT" 確認刪除'));
      }

      // 驗證密碼
      const validatedUser = await UserModel.validatePassword(req.user.email, password);
      if (!validatedUser) {
        return res.status(400).json(errorResponse('密碼錯誤'));
      }

      // 停用帳號而非直接刪除（軟刪除）
      await UserModel.setActiveStatus(userId, false);

      res.json(successResponse(null, '帳號已成功刪除'));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { UserController };
