// 檔案名稱：src/components/CheckOutPage/CheckOutPage.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styles from '../style/CheckOutPage.module.css'; // 假設 CSS 檔名也維持不變

const API_BASE_URL = 'http://localhost:3000';

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$ -';
    return `NT$${Math.round(amount).toLocaleString('en-US')}`;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (error) {
        return 'Invalid Date';
    }
};

// 維持函式名稱為 CheckOutPage
function CheckOutPage() {
    const [orderData, setOrderData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    localStorage.removeItem('anonymousCart');

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setError('網址中找不到訂單編號。');
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/checkout-success?orderId=${orderId}`);
                if (!response.ok) {
                    throw new Error(`無法獲取訂單資訊 (狀態: ${response.status})`);
                }
                const result = await response.json();
                if (result && result.items) {
                    setOrderData(result);
                } else {
                    throw new Error(result.message || '無法解析訂單資料');
                }
            } catch (err) {
                setError(err.message);
                console.error('獲取訂單時發生錯誤:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    if (isLoading) {
        return <div className={styles['page-container']}><div className={styles['success-card']}><h1>正在載入訂單資訊...</h1></div></div>;
    }

    if (error) {
        return <div className={styles['page-container']}><div className={styles['success-card']}><h1>訂單資訊載入失敗</h1><p>{error}</p></div></div>;
    }

    if (!orderData) {
        return <div className={styles['page-container']}><div className={styles['success-card']}><h1>找不到訂單資訊</h1></div></div>;
    }

    return (
        <div className={styles['page-container']}>
            <div className={styles['success-card']}>
                <header className={styles['card-header']}>
                    <p className={styles['thank-you-text']}>Thank you! 🎉</p>
                    <h1>訂單結帳成功</h1>
                </header>

                <div className={styles['product-carousel']}>
                    <div className={styles['carousel-track']}>
                        {orderData.items && orderData.items.map(item => (
                            <div className={styles['carousel-item']} key={item.id}>
                                <img
                                    src={item.image_url || 'https://via.placeholder.com/150'}
                                    alt={item.product_name || item.productName}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <section className={styles['order-details']}>
                    <div className={styles['detail-row']}>
                        <span>訂單編號：</span>
                        <span>{orderData.order_id || orderData.orderNumber || orderData.id}</span>
                    </div>
                    <div className={styles['detail-row']}>
                        <span>訂單日期：</span>
                        <span>{formatDate(orderData.order_date)}</span>
                    </div>
                    <div className={styles['detail-row']}>
                        <span>總金額：</span>
                        <span>{formatCurrency(parseFloat(orderData.total_amount))}</span>
                    </div>
                </section>

                <Link to="/" className={styles['home-button']}>回到主頁</Link>
            </div>
        </div>
    );
}

// 確保匯出的名稱也維持為 CheckOutPage
export default CheckOutPage;