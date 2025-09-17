import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (process.env.USE_ETHEREAL === 'true') {
        // 使用 Ethereal 測試服務
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('✅ Ethereal 郵件服務初始化成功');
        console.log('📧 測試帳號:', testAccount.user);
      } else {
        // 使用 Gmail SMTP
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
        
        // 驗證連接
        await this.transporter.verify();
        console.log('✅ Gmail SMTP 連線成功');
        console.log('📧 寄件者:', process.env.GMAIL_USER);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ 郵件服務初始化失敗:', error);
      throw error;
    }
  }

  // 生成驗證郵件 HTML 模板
  getVerificationEmailHTML(userName, verificationLink, appName = 'EW Member') {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>📧 帳戶驗證</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 2rem; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 1rem 0; }
        .footer { background: #6c757d; color: white; padding: 1rem; text-align: center; border-radius: 0 0 8px 8px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 歡迎加入 ${appName}！</h1>
    </div>
    <div class="content">
        <h2>嗨 ${userName}，</h2>
        <p>感謝您註冊 ${appName}！為了完成註冊程序，請點擊下方按鈕驗證您的電子郵件地址：</p>
        
        <div style="text-align: center; margin: 2rem 0;">
            <a href="${verificationLink}" class="button">✅ 驗證我的帳戶</a>
        </div>
        
        <p><strong>驗證後您將獲得：</strong></p>
        <ul>
            <li>🎁 新會員專屬優惠券</li>
            <li>📧 最新促銷活動通知</li>
            <li>🛍️ 個人化購物體驗</li>
        </ul>
        
        <p>如果按鈕無法點擊，請複製以下連結到瀏覽器：</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 1rem; border-radius: 4px;">
            ${verificationLink}
        </p>
        
        <p><em>此驗證連結將在24小時後失效。</em></p>
    </div>
    <div class="footer">
        <p>© 2024 ${appName}. 此郵件由系統自動發送，請勿回覆。</p>
    </div>
</body>
</html>`;
  }

  // 生成優惠券郵件 HTML 模板
  getCouponEmailHTML(userName, couponCode, discount = 20, appName = 'EW Member') {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🎁 歡迎優惠券</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 2rem; }
        .coupon { background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); border: 3px dashed #e17055; padding: 2rem; text-align: center; margin: 2rem 0; border-radius: 12px; }
        .coupon-code { font-size: 2rem; font-weight: bold; color: #d63031; letter-spacing: 3px; }
        .footer { background: #6c757d; color: white; padding: 1rem; text-align: center; border-radius: 0 0 8px 8px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎁 歡迎加入 ${appName}！</h1>
    </div>
    <div class="content">
        <h2>恭喜 ${userName}！</h2>
        <p>您的帳戶已成功驗證！作為歡迎禮，我們為您準備了專屬優惠券：</p>
        
        <div class="coupon">
            <h3>🎊 新會員專屬優惠</h3>
            <div class="coupon-code">${couponCode}</div>
            <p style="margin: 1rem 0;"><strong>${discount}% 折扣</strong></p>
            <p style="font-size: 0.9em; color: #636e72;">首次購物滿 $500 即可使用</p>
        </div>
        
        <p><strong>如何使用優惠券：</strong></p>
        <ol>
            <li>選擇您喜愛的商品加入購物車</li>
            <li>在結帳頁面輸入優惠券代碼</li>
            <li>享受您的折扣！</li>
        </ol>
        
        <p style="font-size: 0.9em; color: #636e72;"><em>優惠券有效期至 ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')}，請盡快使用！</em></p>
    </div>
    <div class="footer">
        <p>© 2024 ${appName}. 感謝您的加入！</p>
    </div>
</body>
</html>`;
  }

  // 生成重設密碼郵件 HTML 模板
  getPasswordResetEmailHTML(userName, resetLink, appName = 'EW Member') {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🔒 重設密碼</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #fd79a8 0%, #e84393 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 2rem; }
        .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 1rem 0; }
        .footer { background: #6c757d; color: white; padding: 1rem; text-align: center; border-radius: 0 0 8px 8px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 重設您的密碼</h1>
    </div>
    <div class="content">
        <h2>嗨 ${userName}，</h2>
        <p>我們收到您的密碼重設請求。請點擊下方按鈕來重設您的密碼：</p>
        
        <div style="text-align: center; margin: 2rem 0;">
            <a href="${resetLink}" class="button">🔑 重設密碼</a>
        </div>
        
        <p>如果按鈕無法點擊，請複製以下連結到瀏覽器：</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 1rem; border-radius: 4px;">
            ${resetLink}
        </p>
        
        <p><strong>⚠️ 重要提醒：</strong></p>
        <ul>
            <li>此重設連結將在 1 小時後失效</li>
            <li>如果您沒有要求重設密碼，請忽略此郵件</li>
            <li>為了安全起見，請勿將此連結分享給他人</li>
        </ul>
        
        <p><em>如果您持續遇到問題，請聯繫我們的客服團隊。</em></p>
    </div>
    <div class="footer">
        <p>© 2024 ${appName}. 此郵件由系統自動發送，請勿回覆。</p>
    </div>
</body>
</html>`;
  }

  // 發送驗證郵件
  async sendVerificationEmail(email, token, name) {
    if (!this.initialized) {
      await this.initialize();
    }

    const verificationLink = `${process.env.API_URL || 'http://localhost:3000'}/api/v2/auth/verify-email/${token}`;
    const htmlContent = this.getVerificationEmailHTML(name || '用戶', verificationLink, process.env.APP_NAME);
    
    const info = await this.transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'EW Member'}" <${process.env.FROM_EMAIL || process.env.GMAIL_USER}>`,
      to: email,
      subject: '📧 請驗證您的 EW Member 帳戶',
      html: htmlContent
    });

    console.log('✅ 驗證郵件發送成功:', info.messageId);
    
    // 如果使用 Ethereal，提供預覽 URL
    let previewUrl = null;
    if (process.env.USE_ETHEREAL === 'true') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 驗證郵件預覽:', previewUrl);
    }

    return { messageId: info.messageId, previewUrl };
  }

  // 發送優惠券郵件
  async sendCouponEmail(email, couponCode, name, discount = 20) {
    if (!this.initialized) {
      await this.initialize();
    }

    const htmlContent = this.getCouponEmailHTML(name || '用戶', couponCode, discount, process.env.APP_NAME);
    
    const info = await this.transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'EW Member'}" <${process.env.FROM_EMAIL || process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎁 您的 EW Member 歡迎優惠券已送達！',
      html: htmlContent
    });

    console.log('✅ 優惠券郵件發送成功:', info.messageId);
    
    // 如果使用 Ethereal，提供預覽 URL
    let previewUrl = null;
    if (process.env.USE_ETHEREAL === 'true') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 優惠券郵件預覽:', previewUrl);
    }

    return { messageId: info.messageId, previewUrl };
  }

  // 發送重設密碼郵件
  async sendPasswordResetEmail(email, token, name) {
    if (!this.initialized) {
      await this.initialize();
    }

    const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/password-reset?token=${token}&email=${email}`;
    const htmlContent = this.getPasswordResetEmailHTML(name || '用戶', resetLink, process.env.APP_NAME);
    
    const info = await this.transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'EW Member'}" <${process.env.FROM_EMAIL || process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔒 重設您的 EW Member 密碼',
      html: htmlContent
    });

    console.log('✅ 重設密碼郵件發送成功:', info.messageId);
    
    // 如果使用 Ethereal，提供預覽 URL
    let previewUrl = null;
    if (process.env.USE_ETHEREAL === 'true') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 重設密碼郵件預覽:', previewUrl);
    }

    return { messageId: info.messageId, previewUrl };
  }

  // 測試郵件連接
  async testConnection() {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.transporter.verify();
    return {
      service: process.env.USE_ETHEREAL === 'true' ? 'Ethereal' : 'Gmail',
      user: process.env.USE_ETHEREAL === 'true' ? 'Test Account' : process.env.GMAIL_USER
    };
  }
}

// 創建單例實例
export const emailService = new EmailService();
