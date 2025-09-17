import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../style/EmailVerification.css';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('正在驗證您的Email...');
  const [couponCode, setCouponCode] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setVerificationStatus('error');
      setMessage('驗證連結無效，缺少驗證令牌。');
      return;
    }

    verifyEmailToken(token);
  }, [searchParams]);

  const verifyEmailToken = async (token) => {
    try {
      const storedEmail = localStorage.getItem('pending_verify_email') || '';
      const response = await authAPI.verifyEmail(token, storedEmail);
      if (response.success) {
        setVerificationStatus('success');
        setMessage(response.message);
        setCouponCode(response.data.coupon_code);
      } else {
        throw new Error(response.message || 'Email驗證失敗');
      }
    } catch (error) {
      console.error('驗證失敗:', error);
      setVerificationStatus('error');
      setMessage(error.message || 'Email驗證失敗，請稍後再試。');
    }
  };

  const handleResendEmail = async () => {
    if (!resendEmail) {
      alert('請輸入Email地址');
      return;
    }

    setResendLoading(true);
    try {
      const response = await authAPI.resendVerificationEmail(resendEmail);
      if (response.success) {
        alert('驗證信已重新發送，請檢查您的信箱。');
        setResendEmail('');
      } else {
        throw new Error(response.message || '重新發送失敗');
      }
    } catch (error) {
      console.error('重新發送失敗:', error);
      alert(error.message || '重新發送失敗，請稍後再試。');
    }
    setResendLoading(false);
  };

  const goToLogin = () => {
    navigate('/home/auth');
  };

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        {/* 驗證中狀態 */}
        {verificationStatus === 'verifying' && (
          <div className="verification-content">
            <div className="verification-icon loading">
              <span className="material-icons rotating">hourglass_empty</span>
            </div>
            <h1 className="verification-title">Email 驗證中</h1>
            <p className="verification-message">{message}</p>
          </div>
        )}

        {/* 驗證成功狀態 */}
        {verificationStatus === 'success' && (
          <div className="verification-content">
            <div className="verification-icon success">
              <span className="material-icons">check_circle</span>
            </div>
            <h1 className="verification-title">Email 驗證成功！</h1>
            <p className="verification-message">{message}</p>
            
            {/* 優惠券顯示 */}
            {couponCode && (
              <div className="coupon-display">
                <h3>🎉 您的專屬優惠券</h3>
                <div className="coupon-code">
                  <span className="coupon-label">優惠券代碼：</span>
                  <span className="coupon-value">{couponCode}</span>
                  <button 
                    className="copy-button"
                    onClick={() => navigator.clipboard.writeText(couponCode)}
                  >
                    <span className="material-icons">content_copy</span>
                  </button>
                </div>
                <p className="coupon-info">
                  ✅ 優惠券詳情已發送至您的信箱<br/>
                  💰 滿額折扣 NT$100，有效期至 2025年12月31日
                </p>
              </div>
            )}

            <div className="verification-actions">
              <button className="action-button primary" onClick={goToLogin}>
                立即登入
              </button>
              <button className="action-button secondary" onClick={goToHome}>
                返回首頁
              </button>
            </div>
          </div>
        )}

        {/* 驗證失敗狀態 */}
        {verificationStatus === 'error' && (
          <div className="verification-content">
            <div className="verification-icon error">
              <span className="material-icons">error</span>
            </div>
            <h1 className="verification-title">Email 驗證失敗</h1>
            <p className="verification-message">{message}</p>
            
            {/* 重新發送驗證信 */}
            <div className="resend-section">
              <h3>重新發送驗證信</h3>
              <div className="resend-form">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="請輸入您的Email地址"
                  className="resend-input"
                />
                <button 
                  className="resend-button"
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                >
                  {resendLoading ? '發送中...' : '重新發送'}
                </button>
              </div>
            </div>

            <div className="verification-actions">
              <button className="action-button secondary" onClick={goToLogin}>
                返回登入
              </button>
              <button className="action-button secondary" onClick={goToHome}>
                返回首頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
