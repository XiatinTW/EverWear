import { createBrowserRouter, Navigate } from "react-router-dom";
import Header from './components/EriComponts/ui/header.jsx';
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
import AccountLayout from './pages/account/AccountLayout.jsx';
import Profile from './pages/account/Profile.jsx';
import Orders from './pages/account/Orders.jsx';
import Contacts from './pages/account/Contacts.jsx';
import ItemCreate from './pages/admin/ItemCreate';
import Return from './pages/admin/return.jsx';
import Order from './pages/admin/order.jsx';

function ProtectedRoute({ children }) {
  const isAuthed = !!localStorage.getItem('token');
  return isAuthed ? children : <Navigate to="/home/auth" replace />;
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="text-[var(--color-base_text_2)]">頁面不存在</p>
        <a href="/home/auth" className="text-[var(--color-accent_1)] underline">
          回到登入 / 註冊
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/home/item" replace /> },
  { path: "/home", element: <><Header /><Home /></> },
  { path: "/home/brandstory", element: <><Header /><BrandStory /></> },
  { path: "/home/search", element: <><Header /><SearchPage /></> },
  { path: "/home/item", element: <><Header /><Item /></> },
  { path: "/home/itempage", element: <><Header /><ItemPage /></> },
  { path: "/home/skincolor", element: <><Header /><SkinColor /></> },
  { path: "/home/itemmagic", element: <><Header /><ItemMagic /></> },
  { path: "/home/wishlist", element: <><Header /><WishlistPage /></> },
  { path: "/home/cart", element: <><Header /><ShoppingCart /></> },
  { path: "/home/delivery-info", element: <><Header /><DeliverInfoPage /></> },
  { path: "/checkout-success", element: <><Header /><CheckOutPage /></> },
  { path: "/home/auth", element: <><Header /><Auth /></> },
  { path: "/email-verification", element: <><Header /><EmailVerification /></> },
  {
    path: "/home/account",
    element: <ProtectedRoute><><Header /><AccountLayout /></></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="profile" replace /> },
      { path: "profile", element: <Profile /> },
      { path: "orders", element: <Orders /> },
      { path: "contacts/*", element: <Contacts /> },
    ],
  },
  { path: "/admin/itemcreate", element: <ItemCreate /> },
  { path: "/admin/return", element: <Return /> },
  { path: "/admin/order", element: <Order /> },
  { path: "*", element: <NotFound /> },
]);

