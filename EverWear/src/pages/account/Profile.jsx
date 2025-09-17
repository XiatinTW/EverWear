import React, { useState, useEffect } from 'react';
import '../../style/Profile.css';
import { userAPI } from '../../services/api';

export default function Profile() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_day: '',
    email: '',
    password: '',
    newPassword: '',
    phone: '',
    address: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);


  // 載入用戶資料
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getProfile();
        // API回應格式: { success: true, data: { first_name, last_name, ... } }
        if (response.success) {
          const profile = response.data;
          
          // 檢查是否為 Google 用戶
          const isGoogle = profile.google_id && (!profile.password_hash || profile.password_hash === null);
          setIsGoogleUser(isGoogle);
          
          // 格式化日期為 YYYY-MM-DD
          let formattedBirthDay = '';
          if (profile.birth_day) {
            const date = new Date(profile.birth_day);
            if (!isNaN(date.getTime())) {
              formattedBirthDay = date.toISOString().split('T')[0];
            }
          }
          
          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            birth_day: formattedBirthDay,
            email: profile.email || '',
            password: '',
            newPassword: '',
            phone: profile.phone || '',
            address: profile.address || ''
          });
        } else {
          throw new Error(response.message || '載入會員資料失敗');
        }
      } catch (err) {
        setError(err.message || '載入會員資料失敗');
        console.error('載入會員資料錯誤:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 出生日期合理性檢查
    if (formData.birth_day) {
      const birthDate = new Date(formData.birth_day + 'T00:00:00');
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        alert('請輸入有效的出生日期');
        return;
      }
      
      // 檢查年齡合理性（13-120歲）
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      // 如果還沒到生日，年齡減1
      const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
      
      if (actualAge < 13 || actualAge > 120) {
        alert('請輸入合理的出生日期（年齡需在13-120歲之間）');
        return;
      }
    }

    try {
      setLoading(true);
      
      // 分離資料更新和密碼更新
      const profileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_day: formData.birth_day,
        phone: formData.phone,
        address: formData.address
      };
      
      // 更新會員資料
      const updateResponse = await userAPI.updateProfile(profileData);
      
      // 更新表單數據為最新的資料
      if (updateResponse.success && updateResponse.data) {
        // 格式化返回的日期
        let formattedBirthDay = '';
        if (updateResponse.data.birth_day) {
          const date = new Date(updateResponse.data.birth_day);
          if (!isNaN(date.getTime())) {
            formattedBirthDay = date.toISOString().split('T')[0];
          }
        }
        
        setFormData(prev => ({
          ...prev,
          first_name: updateResponse.data.first_name || '',
          last_name: updateResponse.data.last_name || '',
          birth_day: formattedBirthDay,
          phone: updateResponse.data.phone || '',
          address: updateResponse.data.address || ''
        }));
      }
      
      // 如果有新密碼，獨立更新密碼
      if (formData.newPassword) {
        const passwordData = {
          newPassword: formData.newPassword
        };
        
        // 如果不是 Google 用戶或用戶提供了當前密碼，則包含當前密碼
        if (!isGoogleUser || formData.password) {
          passwordData.currentPassword = formData.password;
        }
        
        const passwordResponse = await userAPI.updatePassword(passwordData);
        
        // 清空密碼欄位
        setFormData(prev => ({
          ...prev,
          password: '',
          newPassword: ''
        }));

        alert('資料和密碼更新成功！');
      } else {
        alert('資料更新成功！');
      }
    } catch (err) {
      console.error('更新失敗:', err);
      alert('更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">更新會員資訊</h1>
      
      {loading && <div className="loading">載入中...</div>}
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        {/* FirstName + LastName 並排 */}
        <div className="profile-row">
          <div className="profile-input-group">
            <span className="material-icons profile-input-icon person"></span>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="FirstName"
              className="profile-input"
              required
            />
          </div>
          
          <div className="profile-input-group">
            <span className="material-icons profile-input-icon person"></span>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="LastName"
              className="profile-input"
              required
            />
          </div>
        </div>

        {/* 生日 */}
        <div className="profile-input-group">
          <span className="material-icons profile-input-icon calendar_today"></span>
          <input
            type="date"
            name="birth_day"
            value={formData.birth_day}
            onChange={handleInputChange}
            placeholder="BirthDay"
            className="profile-input"
          />
        </div>

        {/* Email */}
        <div className="profile-input-group">
          <span className="material-icons profile-input-icon email"></span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="E-Mail"
            className="profile-input"
            required
            disabled
          />
        </div>

        {/* Google 用戶提示 */}
        {isGoogleUser && (
          <div className="google-user-notice">
            <span className="material-icons">info</span>
            <p>您使用 Google 帳號註冊，可以設定密碼以便未來使用密碼登入</p>
          </div>
        )}

        {/* 現有密碼 */}
        <div className="profile-input-group">
          <span className="material-icons profile-input-icon lock"></span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={isGoogleUser ? "當前密碼 (可空白)" : "PassWord"}
            className="profile-input"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="profile-password-toggle"
          >
            <span className={`material-icons ${showPassword ? 'visibility_off' : 'visibility'}`}></span>
          </button>
        </div>

        {/* 新密碼 */}
        <div className="profile-input-group">
          <span className="material-icons profile-input-icon lock"></span>
          <input
            type={showNewPassword ? 'text' : 'password'}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            placeholder={isGoogleUser ? "設定新密碼" : "New Password"}
            className="profile-input"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="profile-password-toggle"
          >
            <span className={`material-icons ${showPassword ? 'visibility_off' : 'visibility'}`}></span>
          </button>
        </div>

        {/* 電話 */}
        <div className="profile-input-group">
          <span className="material-icons profile-input-icon phone"></span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Phone"
            className="profile-input"
          />
        </div>

        {/* 地址 */}
        <div className="profile-input-group">
          <span className="material-icons profile-input-icon home"></span>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Address"
            className="profile-input"
          />
        </div>

        {/* 儲存按鈕 */}
        <button type="submit" className="profile-save-btn" disabled={loading}>
          {loading ? '儲存中...' : '儲存變更'}
        </button>
      </form>
    </div>
  );
}
