import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './style/template.css'
import SearchPage from './pages/search';
import Item from './pages/item';
import ItemPage from './pages/itempage';
import SkinColor from './pages/skincolor';
import ItemMagic from './pages/itemmagic';
import WishlistPage from './pages/WishlistPage';
import ShoppingCart from './pages/ShoppingCart';
import DeliverInfoPage from './pages/DeliverInfoPage';
import CheckOutPage from "./pages/CheckOutPage";
import Auth from './pages/Auth.jsx';
import EmailVerification from './pages/EmailVerification.jsx';
import Home from './components/EriComponts/Home.jsx';
import BrandStory from './components/EriComponts/BrandStory.jsx';
// 會員中心相關元件
import AccountLayout from './pages/account/AccountLayout.jsx';
import Profile from './pages/account/Profile.jsx';
import Orders from './pages/account/Orders.jsx';
import Contacts from './pages/account/Contacts.jsx';

// 管理員頁面 (暫時移除搬家)
// import ItemCreate from './pages/admin/ItemCreate';
// import Return from './pages/admin/return.jsx';
// import Order from './pages/admin/order.jsx';

// 匯入 Header 元件
import Header from './components/EriComponts/ui/header.jsx';
import Footer from './components/EriComponts/layout/Footer.jsx';

// 保護路由元件
function ProtectedRoute({ children }) {
  const isAuthed = !!localStorage.getItem('token');
  return isAuthed ? children : <Navigate to="/home/auth" replace />;
}

// 404 頁面
function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-[var(--color-base_text_2)]">頁面不存在</p>
        <a href="/" className="text-[var(--color-accent_1)] underline">
          回到首頁
        </a>
      </div>
    </div>
  );
}

function App() {
  // 依據 localStorage.authToken 判斷是否登入
  const isUserLoggedIn = !!localStorage.getItem('authToken');
  const [wishlistCount, setWishlistCount] = useState(0);

  // 取得待購商品數量
  const fetchWishlistCount = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch('http://localhost:3000/api/v2/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setWishlistCount(result.data.length);
        } else {
          setWishlistCount(0);
        }
      } catch {
        setWishlistCount(0);
      }
    } else {
      // 未登入，抓 localStorage
      const localJson = localStorage.getItem('anonymousWishlist');
      const arr = localJson ? JSON.parse(localJson) : [];
      setWishlistCount(arr.length);
    }
  };

  useEffect(() => {
    fetchWishlistCount();
    // 監聽 localStorage 變化（可選）
    window.addEventListener('storage', fetchWishlistCount);
    return () => window.removeEventListener('storage', fetchWishlistCount);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 首頁導向 */}
        <Route path="/" element={<><Header wishlistCount={wishlistCount} /><Home /><Footer /></>} />
        <Route path="/home/brandstory" element={<><Header wishlistCount={wishlistCount} /><BrandStory /></>} />

        {/* 商品相關路由 */}
        <Route path="/home/search" element={<><Header wishlistCount={wishlistCount} /><SearchPage /></>} />
        <Route path="/home/item" element={<><Header wishlistCount={wishlistCount} /><Item /></>} />
        <Route path="/home/itempage" element={<><Header wishlistCount={wishlistCount} /><ItemPage /></>} />
        <Route path="/home/skincolor" element={<><Header wishlistCount={wishlistCount} /><SkinColor /></>} />
        <Route path="/home/itemmagic" element={<><Header wishlistCount={wishlistCount} /><ItemMagic /></>} />
        {/* 待購 */}
        <Route
          path="/home/wishlist"
          element={
            <>
              <Header wishlistCount={wishlistCount} />
              <WishlistPage
                isLoggedIn={isUserLoggedIn}
                onWishlistChange={fetchWishlistCount}
              />
            </>
          }
        />
        {/* 購物車 */}
        <Route path="/home/cart" element={<><Header wishlistCount={wishlistCount} /><ShoppingCart isLoggedIn={isUserLoggedIn} /></>} />
        {/* 結帳相關路由 */}
        <Route path="/home/delivery-info" element={<><Header wishlistCount={wishlistCount} /><DeliverInfoPage /></>} />
        <Route path="/checkout-success" element={<><Header wishlistCount={wishlistCount} /><CheckOutPage /></>} />

        {/* 會員中心相關路由 */}
        <Route path="/home/auth" element={<><Header wishlistCount={wishlistCount} /><Auth /></>} />
        <Route path="/email-verification" element={<><Header wishlistCount={wishlistCount} /><EmailVerification /></>} />
        <Route
          path="/home/account"
          element={
            <ProtectedRoute>
              <>
                <Header wishlistCount={wishlistCount} />
                <AccountLayout />
              </>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="contacts/*" element={<Contacts />} />
        </Route>
        
        {/* 商品管理頁面 移除頁面 */}
        {/* <Route path="/admin/itemcreate" element={<ItemCreate />} />
        <Route path="/admin/return" element={<Return />} />
        <Route path="/admin/order" element={<Order />} /> */}

        {/* 404 頁面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
