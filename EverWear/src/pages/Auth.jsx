import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../style/Auth.css';
import { authAPI } from '../services/api';
import { googleAuthService } from '../services/googleAuth';
import gsap from 'gsap';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: ''
  });
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const welcomeTitleRef = useRef(null);
  const welcomeBtnRef = useRef(null);
  const [welcomeTitleChars, setWelcomeTitleChars] = useState([]);

  // 檢查 URL 參數中的驗證狀態
  useEffect(() => {
    const message = searchParams.get('message');
    const type = searchParams.get('type');

    if (message && type) {
      let messageText = '';
      let messageType = type;

      switch (message) {
        case 'verified':
          messageText = '✅ 帳戶已驗證，歡迎優惠券已寄送至您的信箱！請登入開始購物！';
          messageType = 'success';
          break;
        case 'already_verified':
          messageText = 'ℹ️ 帳戶已驗證過';
          messageType = 'info';
          break;
        case 'invalid':
          messageText = '❌ 驗證連結無效，請檢查連結是否正確';
          messageType = 'error';
          break;
        case 'error':
          messageText = '❌ 驗證過程發生錯誤，請重試';
          messageType = 'error';
          break;
        default:
          messageText = message;
      }

      setVerificationMessage({ text: messageText, type: messageType });

      // 3秒後自動隱藏訊息
      setTimeout(() => {
        setVerificationMessage(null);
        // 只在驗證訊息時清除 URL 參數，不影響登入失敗
        if (message && type) {
          window.history.replaceState({}, '', '/home/auth');
        }
      }, 5000);
    }
  }, [searchParams]);

  // 初始化 Google Identity Services
  useEffect(() => {
    // 動態載入 Google Identity Services 腳本
    const scriptId = 'google-identity-services';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => setGoogleScriptLoaded(true);
      script.onerror = () => setGoogleScriptLoaded(false);
      document.body.appendChild(script);
    } else {
      setGoogleScriptLoaded(true);
    }

    const initGoogleAuth = async () => {
      try {
        // 等待 Google Identity Services 腳本載入
        const waitForGoogleGIS = () => {
          return new Promise((resolve, reject) => {
            const checkGoogleGIS = () => {
              if (window.google?.accounts?.id) {
                resolve();
              } else {
                setTimeout(checkGoogleGIS, 100);
              }
            };
            checkGoogleGIS();
          });
        };

        await waitForGoogleGIS();
        await googleAuthService.initialize();
        // console.log('Google Identity Services 初始化完成');
      } catch (error) {
        console.error('Google Identity Services 初始化失敗:', error);
      }
    };

    if (googleScriptLoaded) {
      initGoogleAuth();
    }
  }, [googleScriptLoaded]);

  useEffect(() => {
    // 文字拆字元
    const text = isLogin ? 'Welcome, Back!' : 'Hello, Welcome!';
    setWelcomeTitleChars(text.split('').map((char, i) =>
      <span className="char" key={i}>{char === ' ' ? '\u00A0' : char}</span>
    ));
  }, [isLogin]);

  useEffect(() => {
    if (welcomeTitleRef.current) {
      const charsNodeList = welcomeTitleRef.current.querySelectorAll('.char');
      const chars = Array.from(charsNodeList);
      if (chars.length > 0) {
        gsap.set(welcomeTitleRef.current, { opacity: 1 });
        gsap.from(chars, {
          duration: 1.2,
          opacity: 0,
          scale: 0.7,
          y: 40,
          rotationX: 90,
          transformOrigin: '0% 50% -50',
          ease: 'back',
          stagger: 0.04
        });
      }
    }
  }, [welcomeTitleChars]);

  useEffect(() => {
    if (welcomeBtnRef.current) {
      const btn = welcomeBtnRef.current;
      if (btn) {
        const ctx = gsap.context(() => {
          gsap.fromTo(
            btn,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              ease: 'power2.out'
            }
          );
        }, welcomeBtnRef);
        return () => ctx.revert();
      }
    }
  }, [isLogin]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // 登入邏輯 - API使用email
      try {
        const response = await authAPI.login({ email: formData.email, password: formData.password });
        console.log('登入成功:', response);
        // API回應格式: { success: true, data: { token, user } }
        if (response.success && response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
          window.location.href = '/home/account';
        } else {
          // 只顯示 API 回傳的 message 或預設訊息
          throw new Error('登入失敗，請檢查帳號密碼');
        }
      } catch (error) {
        console.error('登入失敗:', error);
        alert('登入失敗，請檢查帳號密碼');
      }
    } else {
      // 註冊邏輯
      if (formData.password !== formData.confirm_password) {
        alert('密碼確認不一致');
        setLoading(false);
        return;
      }
      try {
        const response = await authAPI.register({
          email: formData.email,
          password: formData.password,
          username: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name
        });
        console.log('註冊成功:', response);

        if (response.success) {
          // 🎯 顯示註冊成功與 Email 驗證提示
          // 保存待驗證 email，供 EmailVerification 頁面使用
          try { localStorage.setItem('pending_verify_email', formData.email); } catch (e) { console.warn('無法寫入 pending_verify_email', e); }
          alert(`${response.message}\n\n✅ 請檢查您的 Email 信箱\n📧 點擊驗證連結即可獲得專屬優惠券！`);
          setIsLogin(true); // 切換到登入模式
          setFormData({
            email: formData.email, // 保留 email 方便登入
            password: '',
            confirm_password: '',
            first_name: '',
            last_name: ''
          });
        } else {
          throw new Error(response.message || '註冊失敗');
        }
      } catch (error) {
        console.error('註冊失敗:', error);
        alert(error.message || '註冊失敗，請重試');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!googleScriptLoaded) {
      alert('Google 登入服務尚未載入，請稍候再試。');
      return;
    }
    setGoogleLoading(true);
    try {
      const googleUser = await googleAuthService.signIn();
      console.log('Google 用戶資訊:', googleUser);

      const response = await authAPI.googleLogin({
        id: googleUser.id,
        email: googleUser.email,
        first_name: googleUser.firstName || googleUser.first_name,
        last_name: googleUser.lastName || googleUser.last_name,
        accessToken: googleUser.accessToken
      });
      console.log('Google 登入回應:', response);

      if (response.success) {
        // 檢查是否為新用戶註冊且有優惠券
        if (response.data.coupon_code) {
          alert(`🎉 ${response.message}\n\n✨ 您的專屬優惠券：${response.data.coupon_code}\n📧 優惠券詳情已發送至您的信箱！`);
        } else {
          alert(response.message || 'Google 登入成功！');
        }
        window.location.href = '/home/account';
      } else {
        throw new Error(response.message || 'Google 登入失敗');
      }
    } catch (error) {
      console.error('Google 登入失敗:', error);
      if (
        error.message &&
        (error.message.includes('popup_closed_by_user') ||
         error.message.includes('Google Identity Services not loaded'))
      ) {
        // 用戶關閉彈窗或 GIS 未載入，不顯示錯誤訊息
        if (error.message.includes('Google Identity Services not loaded')) {
          alert('Google 登入服務尚未載入，請稍候再試。');
        }
      } else {
        alert(error.message || 'Google 登入失敗，請重試');
      }
    }
    setGoogleLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: ''
    });
  };

  // 登入狀態自動導向
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/home/account';
    }
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* 左側歡迎面板 (登入時) / 右側歡迎面板 (註冊時) */}
        <div className={`auth-welcome-panel ${!isLogin ? 'slide-right' : ''}`}>
          <div className="auth-welcome-content">
            <h1
              className="auth-welcome-title"
              ref={welcomeTitleRef}
            >
              {welcomeTitleChars}
            </h1>
            <p className="auth-welcome-subtitle">
              {isLogin ? '加入會員獲取更多優惠！' : '已有帳號？'}
            </p>
            <button
              className="auth-welcome-btn"
              onClick={toggleMode}
              ref={welcomeBtnRef}
            >
              {isLogin ? '註冊' : '登入'}
            </button>
          </div>
        </div>

        {/* 右側表單面板 (登入時) / 左側表單面板 (註冊時) */}
        <div className={`auth-form-panel ${!isLogin ? 'slide-left' : ''}`}>
          <h2 className="auth-form-title">
            {isLogin ? '會員登入' : '註冊新帳號'}
          </h2>

          {/* 驗證狀態訊息 */}
          {verificationMessage && (
            <div className={`auth-verification-message ${verificationMessage.type}`}>
              {verificationMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* 姓名輸入框 (僅註冊時顯示) */}
            {!isLogin && (
              <div className="auth-name-row">
                <div className="auth-input-group auth-input-half">
                  <span className="material-icons profile-input-icon person"></span>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className="auth-input"
                    required
                  />
                </div>
                <div className="auth-input-group auth-input-half">
                  <span className="material-icons profile-input-icon person"></span>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className="auth-input"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email 輸入框 */}
            <div className="auth-input-group">
              <span className="material-icons profile-input-icon email"></span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="auth-input"
                required
              />
            </div>

            {/* 密碼輸入框 */}
            <div className="auth-input-group">
              <span className="material-icons profile-input-icon lock"></span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="auth-input"
                required
                onFocus={() => setShowPasswordHint(true)}
                onBlur={() => setShowPasswordHint(false)}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className={`material-icons ${showPassword ? 'visibility_off' : 'visibility'}`}></span>
              </button>
              {showPasswordHint && (
                <span className="auth-password-hint">
                  密碼需至少8碼，包含大小寫英文與數字
                </span>
              )}
            </div>

            {/* 確認密碼輸入框 (僅註冊時顯示) */}
            {!isLogin && (
              <div className="auth-input-group">
              <span className="material-icons profile-input-icon lock"></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  className="auth-input"
                  required
                />
              </div>
            )}

            {/* 註冊條款說明 (僅註冊時顯示) */}
            {!isLogin && (
              <p className="auth-register-note">
                註冊表示同意商店服務條款與會員責任規範及個資聲明
              </p>
            )}

            {/* 提交按鈕 */}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {isLogin ? '登入' : '註冊'}
            </button>

            {/* Google 登入 */}
            <div className="auth-google-section">
              <p className="auth-google-text">Sign in with Google</p>
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleLogin}
                disabled={googleLoading || !googleScriptLoaded}
              >
                {!googleScriptLoaded ? (
                  <>
                    <span className="material-icons">error_outline</span>
                    Google 登入服務未載入
                  </>
                ) : googleLoading ? (
                  <>
                    <span className="material-icons hourglass_empty"></span>
                    登入中...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}