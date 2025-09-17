import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx"; // 共用側邊欄
import "../../style/Account.css"; // 會員中心樣式
import Footer from "../../components/EriComponts/layout/Footer.jsx";

export default function AccountLayout() {
  return (
    <>
      <div className="account-layout">
        {/* 左側 Sidebar */}
        <aside className="account-sidebar">
          <Sidebar />
        </aside>

        {/* 右側 Outlet：會顯示 Profile / Orders / Contacts */}
        <main className="account-content">
          <div className="account-content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
