const { UserModel } = require('../models/User');
const { generateToken, generateVerificationCode, successResponse, errorResponse } = require('../utils/helpers');
const { validateEmail, validatePassword } = require('../middleware/validation');
const { emailService } = require('../services/emailService');
const crypto = require('crypto');

const AuthController = {
  register: async function(req, res, next) {
    try {
      const { email, password, username, first_name, last_name, phone } = req.body;
      
      // 基本驗證
      if (!email || !password || !username || !first_name || !last_name) {
        return res.status(400).json(errorResponse('請填寫所有必填欄位'));
      }
      if (!validateEmail(email)) {
        return res.status(400).json(errorResponse('請輸入有效的電子郵件地址'));
      }
      if (!validatePassword(password)) {
        return res.status(400).json(errorResponse('密碼必須至少包含 8 個字符，包括大小寫字母和數字'));
      }
      
      // 檢查重複
      if (await UserModel.emailExists(email)) {
        return res.status(400).json(errorResponse('此電子郵件已被註冊'));
      }
      if (await UserModel.usernameExists(username)) {
        return res.status(400).json(errorResponse('此用戶名已被使用'));
      }
      
      // 🎯 新流程：先嘗試發送驗證郵件
      const verificationToken = crypto.randomBytes(32).toString('hex');
      try {
        await emailService.sendVerificationEmail(email, verificationToken, first_name);
        console.log(`✅ 驗證郵件發送成功: ${email}`);
      } catch (emailError) {
        console.error('❌ 驗證郵件發送失敗:', emailError);
        
        // 根據錯誤類型返回不同訊息
        let errorMessage = '無法發送驗證郵件，請檢查郵件地址是否正確';
        
        if (emailError.message && emailError.message.includes('Invalid login')) {
          errorMessage = '郵件服務設定錯誤，請聯繫客服';
        } else if (emailError.message && emailError.message.includes('timeout')) {
          errorMessage = '郵件服務暫時無法使用，請稍後再試';
        } else if (emailError.message && (emailError.message.includes('Invalid recipients') || emailError.message.includes('550'))) {
          errorMessage = '郵件地址不存在或無效，請檢查後重新輸入';
        }
        
        return res.status(400).json(errorResponse(errorMessage));
      }
      
      // 📧 郵件發送成功，才創建用戶帳戶
      const userId = await UserModel.create({ email, password, username, first_name, last_name, phone });
      const expiresAt = new Date(Date.now() + 24*60*60*1000);
      await UserModel.setVerificationToken(userId, verificationToken, expiresAt);
      
      const token = generateToken(userId);
      const user = await UserModel.findById(userId);
      
      res.status(201).json(successResponse({ 
        user: { 
          id: user.id, 
          email: user.email, 
          username: user.username, 
          first_name: user.first_name, 
          last_name: user.last_name, 
          phone: user.phone, 
          email_verified: user.email_verified 
        }, 
        token 
      }, '註冊成功！請檢查您的郵件進行驗證'));
    } catch (error) { 
      console.error('註冊過程錯誤:', error);
      next(error); 
    }
  },

  login: async function(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json(errorResponse('請輸入電子郵件和密碼'));
      if (!validateEmail(email)) return res.status(400).json(errorResponse('請輸入有效的電子郵件地址'));
      const user = await UserModel.validatePassword(email, password);
      if (!user) return res.status(401).json(errorResponse('電子郵件或密碼錯誤'));
      const token = generateToken(user.id);
      const userProfile = await UserModel.findById(user.id);
      res.json(successResponse({ user: { id: userProfile.id, email: userProfile.email, username: userProfile.username, first_name: userProfile.first_name, last_name: userProfile.last_name, email_verified: userProfile.email_verified }, token }, '登入成功'));
    } catch (error) { next(error); }
  },

  verifyToken: async function(req, res, next) {
    try {
      const user = req.user;
      res.json(successResponse({ user: { id: user.id, email: user.email, username: user.username, first_name: user.first_name, last_name: user.last_name, email_verified: user.email_verified } }, '令牌有效'));
    } catch (error) { next(error); }
  },

  sendEmailVerification: async function(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json(errorResponse('用戶不存在'));
      if (user.email_verified) return res.status(400).json(errorResponse('電子郵件已經過驗證'));
      const verificationCode = generateVerificationCode();
      res.json(successResponse({ message: '驗證碼已發送到您的電子郵件', ...(process.env.NODE_ENV==='development' && { verification_code: verificationCode }) }));
    } catch (error) { next(error); }
  },

  verifyEmail: async function(req, res, next) {
    try {
      const token = req.params.token || req.body.token || req.query.token;
      
      // 檢查必要參數
      if (!token) {
        return res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/home/auth?message=invalid&type=error`);
      }
      
      // 查找用戶
      const user = await UserModel.findByVerificationToken(token);
      if (!user) {
        return res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/home/auth?message=invalid&type=error`);
      }
      
      // 🎯 新邏輯：用 email_verified 作為唯一判斷標準
      if (user.email_verified) {
        // 已驗證過，直接重定向
        return res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/home/auth?message=already_verified&type=info`);
      }
      
      // 首次驗證：執行驗證流程
      await UserModel.confirmEmailVerification(user.id);
      
      // 🔄 保留 token 不清空，讓連結可重複點擊
      
      // 發送優惠券郵件
      const couponCode = `WELCOME${Date.now().toString().slice(-6)}`;
      try { 
        // 先存入資料庫
        await UserModel.createAndAssignCoupon(user.id, couponCode, 'Email驗證歡迎優惠');
        
        // 再發送郵件
        await emailService.sendCouponEmail(user.email, couponCode, user.first_name || '用戶'); 
        console.log(`✅ 首次驗證成功，優惠券已存入資料庫並發送: ${user.email} - ${couponCode}`);
      } catch (e) { 
        console.error('❌ 優惠券處理失敗:', e); 
      }
      
      // 重定向到登入頁面顯示成功訊息
      res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/home/auth?message=verified&type=success`);
    } catch (error) { 
      console.error('❌ 驗證過程錯誤:', error);
      res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/home/auth?message=error&type=error`);
    }
  },

  resendVerificationEmail: async function(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json(errorResponse('請提供電子郵件地址'));
      const user = await UserModel.findByEmailWithTokens(email);
      if (!user) return res.status(400).json(errorResponse('找不到該電子郵件對應的用戶'));
      if (user.email_verified) return res.status(400).json(errorResponse('該電子郵件已經通過驗證'));
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24*60*60*1000);
      await UserModel.setVerificationToken(user.id, verificationToken, expiresAt);
      await emailService.sendVerificationEmail(email, verificationToken, user.first_name || '用戶');
      res.json(successResponse(null, '驗證郵件已重新發送'));
    } catch (error) { next(error); }
  },

  requestPasswordReset: async function(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json(errorResponse('請提供電子郵件地址'));
      if (!validateEmail(email)) return res.status(400).json(errorResponse('請輸入有效的電子郵件地址'));
      const user = await UserModel.findByEmail(email);
      if (!user) return res.json(successResponse(null, '如果該電子郵件地址已註冊，您將收到密碼重設郵件'));
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60*60*1000);
      await UserModel.setPasswordResetToken(user.id || user.user_id, resetToken, expiresAt);
      await emailService.sendPasswordResetEmail(email, resetToken, user.first_name || '用戶');
      res.json(successResponse(null, '如果該電子郵件地址已註冊，您將收到密碼重設郵件'));
    } catch (error) { next(error); }
  },

  confirmPasswordReset: async function(req, res, next) {
    try {
      const { token, email, newPassword } = req.body;
      if (!token || !email || !newPassword) return res.status(400).json(errorResponse('請提供所有必填欄位'));
      if (!validatePassword(newPassword)) return res.status(400).json(errorResponse('密碼必須至少包含 8 個字符，包括大小寫字母和數字'));
      const user = await UserModel.findByResetToken(token);
      if (!user) return res.status(400).json(errorResponse('無效的重設連結'));
      if (new Date() > new Date(user.reset_token_expires)) return res.status(400).json(errorResponse('重設連結已過期，請重新申請密碼重設'));
      await UserModel.confirmPasswordReset(user.id, newPassword);
      res.json(successResponse(null, '密碼重設成功'));
    } catch (error) { next(error); }
  },

  googleLogin: async function(req, res, next) {
    try {
      const { google_id, email, first_name, last_name, access_token } = req.body; // access_token 可供未來延伸
      if (!google_id || !email) return res.status(400).json(errorResponse('Google 用戶資訊不完整'));
      
      let user = await UserModel.findByGoogleId(google_id);
      let isNewUser = false;
      let couponCode = null;
      
      if (!user) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          // 現有用戶綁定 Google 帳號
          await UserModel.bindGoogleAccount(existingUser.id, google_id);
          user = existingUser;
        } else {
          // 🎯 全新 Google 用戶註冊
          isNewUser = true;
          const userId = await UserModel.createGoogleUser({ 
            googleId: google_id, 
            email, 
            first_name: first_name || '', 
            last_name: last_name || '' 
          });
          user = await UserModel.findById(userId);
          
          // 立即發送歡迎優惠券給新 Google 用戶
          couponCode = `GWELCOME${Date.now().toString().slice(-6)}`;
          try { 
            // 先存入資料庫
            await UserModel.createAndAssignCoupon(userId, couponCode, 'Google註冊歡迎優惠');
            
            // 再發送郵件
            await emailService.sendCouponEmail(email, couponCode, user.first_name || '用戶'); 
            console.log(`✅ Google 新用戶註冊成功，優惠券已存入資料庫並發送: ${email} - ${couponCode}`);
          } catch (e) { 
            console.error('❌ Google 新用戶優惠券處理失敗:', e); 
          }
        }
      }
      
      const jwtToken = generateToken(user.id || user.user_id);
      
      // 根據是否為新用戶返回不同訊息和資料
      const responseData = { 
        user: { 
          id: user.id || user.user_id, 
          email: user.email, 
          username: user.username || user.email, 
          first_name: user.first_name, 
          last_name: user.last_name, 
          email_verified: 1 
        }, 
        token: jwtToken 
      };
      
      // 如果是新用戶且有優惠券，加入回應資料
      if (isNewUser && couponCode) {
        responseData.coupon_code = couponCode;
      }
      
      const responseMessage = isNewUser ? 
        'Google 註冊成功！🎉 歡迎優惠券已發送至您的郵箱' : 
        'Google 登入成功';
        
      res.json(successResponse(responseData, responseMessage));
    } catch (error) { next(error); }
  }
};

module.exports = { AuthController };
