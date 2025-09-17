// src/components/DeliverInfoPage/DeliverInfoPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import styles from '../style/DeliverInfoPage.module.css';

// API and Authentication constants
const API_BASE_URL = 'http://localhost:3000/api/v2';


function DeliverInfoPage() {
    const [formData, setFormData] = useState({
        recipientLastName: '', recipientFirstName: '', postalCode: '',
        address: '', phone: '', email: ''
    });
    const [cartData, setCartData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const formRef = useRef(null);


    // 判斷是否登入（有 token 才算登入）
    const isUserLoggedIn = () => {
        const token = localStorage.getItem('token');
        return !!(token && token.trim());
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return { 'Authorization': `Bearer ${token}` };
    };

    // Fetch initial data (cart and user info) when the component mounts
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                if (isUserLoggedIn()) {
                    // --- 已登入的邏輯 ---
                    const [cartResponse, userResponse] = await Promise.all([
                        fetch(`${API_BASE_URL}/cart`, { headers: getAuthHeaders() }),
                        fetch(`${API_BASE_URL}/users/me`, { headers: getAuthHeaders() })
                    ]);

                    if (!cartResponse.ok || !userResponse.ok) {
                        throw new Error('無法載入頁面所需資料，請確認登入狀態或稍後再試。');
                    }

                    const cartResult = await cartResponse.json();
                    const userResult = await userResponse.json();

                    if (cartResult.success) setCartData(cartResult.data);

                    if (userResult.success && userResult.data) {
                        // 預先填入會員資料
                        setFormData(prevData => ({
                            ...prevData,
                            recipientLastName: userResult.data.lastName || '',
                            recipientFirstName: userResult.data.firstName || '',
                            phone: userResult.data.phone || '',
                            email: userResult.data.username || ''
                        }));
                    }
                } else {
                    // --- 未登入的邏輯 ---
                    // 讀取本地購物車
                    const localCartJson = localStorage.getItem('anonymousCart');
                    const localCart = localCartJson ? JSON.parse(localCartJson) : null;
                    // 修正：補齊 subtotal, totalAmount 欄位
                    let items = Array.isArray(localCart) ? localCart : localCart?.items || [];
                    let subtotal = 0;
                    let totalAmount = 0;
                    if (items.length > 0) {
                        subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        totalAmount = subtotal;
                    }
                    setCartData({ items, subtotal, totalAmount });
                    // 表單將會是空的，讓使用者自行填寫
                }
            } catch (err) {
                setError(err.message);
                console.error('初始化資料時發生錯誤:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Handler for form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Handler for form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        for (const key in formData) {
            if (!formData[key].trim()) {
                alert('所有欄位皆為必填項目，請檢查後再提交。');
                return;
            }
        }

        // --- 修正：購物車資料判斷 ---
        if (!cartData || !Array.isArray(cartData.items) || cartData.items.length === 0) {
            alert('購物車是空的，無法建立訂單。');
            return;
        }

        // 建立要傳送的 payload
        const orderPayload = {
            shippingInfo: {
                lastName: formData.recipientLastName,
                firstName: formData.recipientFirstName,
                phone: formData.phone,
                address: formData.address
            }
        };

        // --- 匿名結帳 cartItems 結構 ---
        if (!isUserLoggedIn()) {
            // 匿名模式，後端 user_id 會自動設為 'guest'
            // cartData.items 必須是陣列且每個 item 需有 productId 或 product_id
            const validItems = Array.isArray(cartData.items)
                ? cartData.items.filter(item => item.productId || item.product_id)
                : [];
            // 修正：將 price, sizeId, colorId 轉成數字
            orderPayload.cartItems = validItems.map(item => ({
                ...item,
                price: Number(item.price),
                sizeId: item.sizeId ? Number(item.sizeId) : item.sizeId,
                colorId: item.colorId ? Number(item.colorId) : item.colorId,
                quantity: item.quantity ? Number(item.quantity) : item.quantity
            }));
        }

        try {
            let headers = { 'Content-Type': 'application/json' };
            if (isUserLoggedIn()) {
                const token = localStorage.getItem('token');
                if (token && token.trim()) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } else {
                // 匿名模式，不送 Authorization header
                if ('Authorization' in headers) delete headers['Authorization'];
            }

            // --- debug log: 檢查 payload與header ---
            console.log('orderPayload:', orderPayload);
            console.log('headers:', headers);

            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                // 嘗試解析後端回傳的 JSON 錯誤訊息
                const errorResult = await response.json().catch(() => null);
                alert('後端訊息: ' + (errorResult?.message || '建立訂單失敗'));
                throw new Error(errorResult?.message || '建立訂單失敗');
            }

            // 後端會回傳一個 HTML 表單字串，我們用它來取代當前頁面以跳轉到付款閘道
            const paymentHtml = await response.text();

            // 1. 建立一個暫時的 div 容器來解析 HTML 字串
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = paymentHtml;

            // 2. 從容器中找到 form 元素
            const formElement = tempDiv.querySelector('#ecpay-form');
            if (!formElement) {
                throw new Error('從伺服器回傳的內容中找不到付款表單。');
            }

            // 3. 將這個 form 元素暫時加到頁面的 body 中
            document.body.appendChild(formElement);

            // 4. 以程式化的方式提交這個 form
            formElement.submit();

            // 5. 提交後，可以從頁面中移除這個 form (可選，但建議)
            document.body.removeChild(formElement);

            // --- 修正的核心邏輯結束 ---

        } catch (err) {
            alert(`操作失敗: ${err.message}`);
            console.error('建立訂單時發生錯誤:', err);
        }
    };
    if (isLoading) return <div className={styles['page-container']}><p>載入中...</p></div>;
    if (error) return <div className={styles['page-container']}><p>錯誤: {error}</p></div>;

    return (
        <div className={styles['page-container']}>
            <div className={styles['shipping-container']}>
                <section className={styles['shipping-details-section']}>
                    <div className={styles['step-indicator']}>
                        <span className={styles.active}>運送資訊</span>
                        <span>付款資訊</span>
                    </div>

                    <form ref={formRef} id="delivery-form" method="POST" action={`${API_BASE_URL}/orders`} onSubmit={handleSubmit}>
                        <div className={styles['form-grid']}>
                            {Object.keys(formData).map(key => {
                                const labels = {
                                    recipientLastName: '姓氏',
                                    recipientFirstName: '名字',
                                    postalCode: '郵遞區號',
                                    address: '地址',
                                    phone: '電話號碼',
                                    email: '電子郵件'
                                };
                                const fieldClasses = {
                                    postalCode: styles['field-postal'], address: styles['field-address'],
                                    phone: styles['field-phone'], email: styles['field-email']
                                };
                                return (
                                    <div key={key} className={`${styles['form-field']} ${fieldClasses[key] || ''}`}>
                                        <label htmlFor={key}>{labels[key]}</label>
                                        <input type="text" id={key} name={key} value={formData[key]} onChange={handleInputChange} />
                                    </div>
                                );
                            })}
                        </div>
                        <input type="hidden" id="order-payload-input" name="orderPayload" />

                    </form>
                </section>

                <section className={styles['order-summary-section']}>
                    <div className={styles['summary-items-list']}>
                        {(cartData && Array.isArray(cartData.items) ? cartData.items : []).map((item, index) => (
                            <div
                                key={item.cartItemId || item.productId || item.product_id || index}
                                className={styles['summary-item']}
                            >
                                <img
                                    src={item.image_url ? item.image_url.replace('/assets/itemImage/', '/image/itemImage/') : ''}
                                    alt={item.name}
                                />
                                <div className={styles['item-details']}>
                                    <p><strong>{item.name}</strong></p>
                                    <p>數量 : {item.quantity}</p>
                                    <p>顏色 : {item.color_name}</p>
                                    <p>尺寸 : {item.size_name}</p>
                                    <p>價格 : NT${Math.round(item.price).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <hr />
                    <div className={styles['summary-totals']}>
                        <div className={styles['summary-row']}>
                            <span>產品金額</span>
                            <span>NT${cartData?.subtotal?.toLocaleString() || 0}</span>
                        </div>
                        <div className={styles['summary-row']}>
                            <span>運送費用</span>
                            <span>NT$0</span>
                        </div>
                        {/* 匿名結帳不顯示折扣 */}
                        <hr />
                        <div className={`${styles['summary-row']} ${styles.total}`}>
                            <span>總計</span>
                            <span>NT${cartData?.totalAmount?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                    <button type="submit" form="delivery-form" className={styles['confirm-btn']}>運送資訊確認</button>
                </section>
            </div>
        </div>
    );
}

export default DeliverInfoPage;
