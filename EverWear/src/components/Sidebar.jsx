import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { userAPI, authAPI } from "../services/api";

export default function Sidebar() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 切換選單狀態
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 關閉選單
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 從 API 獲取用戶資料
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // 檢查是否已登入
        const token = localStorage.getItem('token');
        if (token) {
          const response = await userAPI.getProfile();
          // API回應格式: { success: true, data: { firstName, lastName, ... } }
          if (response.success) {
            setUserInfo(response.data);
          } else {
            throw new Error(response.message || '獲取用戶資料失敗');
          }
        } else {
          // 如果沒有 token，使用模擬資料
          const mockUserData = {
            firstName: "王",
            lastName: "小明",
            username: "user@example.com"
          };
          setUserInfo(mockUserData);
        }
      } catch (error) {
        console.error('獲取用戶資料失敗:', error);
        // 降級到模擬資料
        const mockUserData = {
          firstName: "王",
          lastName: "小明",
          username: "user@example.com"
        };
        setUserInfo(mockUserData);
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
  }, []);

  // 登出處理
  const handleLogout = () => {
    if (confirm('確定要登出嗎？')) {
      authAPI.logout();
      // 重導向到登入頁面
      window.location.href = '/home/auth';
    }
  };

  return (
    <>
      {/* 手機版頂部導覽條 */}
      <div className="mobile-nav-bar">
        {/* 歡迎訊息 */}
        <div className="mobile-welcome">
          {loading ? (
            '載入中...'
          ) : userInfo ? (
            `歡迎 ${userInfo.last_name}${userInfo.first_name}`
          ) : (
            '歡迎 user'
          )}
        </div>
        
        {/* 漢堡按鈕 */}
        <button 
          className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="選單"
        >
        </button>
      </div>

      {/* 遮罩層 */}
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

      {/* 側邊選單 */}
      <nav className={`account-nav ${isMenuOpen ? 'menu-open' : ''}`}>
        {/* 桌面版用戶歡迎訊息 */}
        <div className="account-welcome desktop-only">
          {loading ? (
            '載入中...'
          ) : userInfo ? (
            `您好，${userInfo.last_name} ${userInfo.first_name}`
          ) : (
            '歡迎'
          )}
        </div>
        
        <NavLink 
          to="/home/account/profile" 
          className={({ isActive }) => 
            `account-nav-link ${isActive ? 'active' : ''}`
          }
          onClick={closeMenu}
        >
          會員資料
        </NavLink>
        <NavLink 
          to="/home/account/orders" 
          className={({ isActive }) => 
            `account-nav-link ${isActive ? 'active' : ''}`
          }
          onClick={closeMenu}
        >
          訂單紀錄
        </NavLink>
        <NavLink 
          to="/home/account/contacts" 
          className={({ isActive }) => 
            `account-nav-link ${isActive ? 'active' : ''}`
          }
          onClick={closeMenu}
        >
          聯絡我們
        </NavLink>
        
        {/* 登出按鈕 */}
        <NavLink 
          to="#"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
            closeMenu();
          }}
          className="account-nav-logout"
        >
          登出
        </NavLink>
      </nav>
    </>
  );
}