import React, { useState, useEffect } from 'react';
import '../../style/Orders.css';
import { orderAPI } from '../../services/api';

export default function Orders() {
  // 展開狀態管理 - 全部收合開始
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入訂單資料
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const response = await orderAPI.getUserOrders();
        // API回應格式: { success: true, data: [...] }
        if (response.success) {
          setOrdersData(response.data);
        } else {
          throw new Error(response.message || '載入訂單資料失敗');
        }
      } catch (err) {
        setError(err.message || '載入訂單資料失敗');
        console.error('載入訂單錯誤:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // 切換展開狀態
  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // 格式化金額
  const formatPrice = (price) => {
    return `NT$${price.toLocaleString()}`;
  };

  // 圖片載入錯誤處理
  const handleImageError = (e) => {
    e.target.src = '/image/itemImage/logo.png'; // 改為和後端一致
    e.target.style.backgroundColor = 'var(--color-secondary_2)';
  };

  return (
    <div className="orders-container">
      <h1 className="orders-title">訂單紀錄</h1>
      
      {loading && <div className="loading">載入中...</div>}
      {error && <div className="error">{error}</div>}
      
      <div className="orders-list">
        {loading && <p>載入中...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && ordersData.length === 0 && (
          <div className="no-orders">
            <p>尚未有訂單記錄</p>
            <p>快去購物車結帳創建您的第一筆訂單吧！</p>
          </div>
        )}
        {!loading && !error && ordersData.length > 0 && ordersData.map((order) => (
          <div 
            key={order.id} 
            className={`order-card ${expandedOrders.has(order.id) ? 'expanded' : ''}`}
          >
            {/* 訂單標題列 */}
            <div 
              className="order-header"
              onClick={() => toggleOrder(order.id)}
            >
              <h3 className="order-number">
                訂單編號：#{order.id}
              </h3>
              <span className="material-icons order-expand-icon expand_more"></span>
            </div>

            {/* 訂單詳細內容 */}
            <div className="order-details">
              <div className="order-details-content">
                {/* 訂購日期 */}
                <div className="order-date">
                  訂購日期：{order.orderDate}
                </div>

                {/* 商品列表 */}
                <div className="order-items">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="order-item">
                      {/* 商品圖片 */}
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="item-image"
                        onError={handleImageError}
                      />
                      
                      {/* 商品資訊 */}
                      <div className="item-info">
                        <h4 className="item-name">{item.name}</h4>
                        <p className="item-specs">
                          {item.color}.{item.size}
                        </p>
                      </div>
                      
                      {/* 價格和數量 */}
                      <div className="item-price-qty">
                        <p className="item-price">
                          {formatPrice(item.price)}
                        </p>
                        <p className="item-quantity">
                          x{item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 訂單總計 */}
                <div className="order-total">
                  <h3 className="order-total-amount">
                    ${order.totalAmount.toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
