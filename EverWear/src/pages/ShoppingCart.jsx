import React, { useState, useEffect } from 'react';
import styles from '../style/ShoppingCart.module.css';
import InfoItem from '../components/common/InfoItem';
import BookmarkIcon, { DeleteIcon } from '../components/common/BookmarkIcon';
import Footer from '../components/EriComponts/layout/Footer.jsx';

const API_BASE_URL = 'http://localhost:3000/api/v2';

//記得處理登入狀態，現在是強制匿名購物車
const ShoppingCart = () => {
  // 直接在元件最上方宣告 isLoggedIn
  const isLoggedIn = !!localStorage.getItem('token');

  const [cartData, setCartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDiscountVisible, setIsDiscountVisible] = useState(false);
  const [discountCode, setDiscountCode] = useState('');

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0';
    // 移除小數部分並加上千分位符號
    return new Intl.NumberFormat().format(Math.trunc(price));
  };

  // [新增] 建立一個輔助函式，用來讀取或初始化本地的匿名購物車
  const getLocalCart = () => {
    const localCartJson = localStorage.getItem('anonymousCart');
    if (localCartJson) {
      return JSON.parse(localCartJson); // ← 這裡會有 items 屬性
    }
    return { items: [], subtotal: 0, discount: { amount: 0, message: '' }, totalAmount: 0 };
  };

  // [新增] 建立一個輔助函式，用來更新本地購物車並同步到 localStorage
  const updateLocalCart = (newCartData) => {
    // 可以在這裡加入計算總金額的邏輯
    // 為求簡化，假設傳入的 newCartData 已計算好金額
    localStorage.setItem('anonymousCart', JSON.stringify(newCartData));
    setCartData(newCartData);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { 'Content-Type': 'application/json' };
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // [新增] 建立一個專門計算本地購物車總金額的函式
  const calculateLocalCartTotals = (cart) => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.subtotal = subtotal;
    cart.totalAmount = subtotal; // 匿名購物車不支援折扣
    return cart;
  };

  const fetchCartData = async () => {
    setIsLoading(true);
    setError(null);

    if (isLoggedIn) {
      // 已登入：從 API 取得購物車資料
      try {
        const response = await fetch(`${API_BASE_URL}/cart`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`API 請求失敗: ${response.status}`);
        const result = await response.json();
        if (result.success && result.data) {
          setCartData(result.data); // result.data.items
        } else {
          throw new Error(result.message || '無法載入購物車內容。');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // 未登入：從 localStorage 取得購物車資料
      const localCart = getLocalCart(); // localCart.items
      setCartData(localCart);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
    const localCartJson = localStorage.getItem('anonymousCart');
  }, [isLoggedIn]); // 依據 isLoggedIn 狀態切換

  // ▼▼▼ 【功能修正】 ▼▼▼
  const handleRemoveItem = async (cartItemId) => {
    if (isLoggedIn) {
      // 已登入：呼叫 API
      try {
        const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('移除商品失敗');
        const result = await response.json();
        if (result.success) {
          setCartData(result.data);
        }
      } catch (error) {
        console.error('移除商品時發生錯誤:', error);
        alert('移除商品失敗，請稍後再試。');
      }
    } else {
      // 未登入：移除商品後重新計算總價
      let localCart = getLocalCart();
      localCart.items = localCart.items.filter(item => item.cartItemId !== cartItemId);
      const recalculatedCart = calculateLocalCartTotals(localCart);
      updateLocalCart(recalculatedCart);
    }
  };

  const handleMoveToWishlist = async (productId, cartItemId) => {
    if (!isLoggedIn) {
      alert('請先登入才能將商品加入待購清單。');
      return;
    }
    // 已登入的邏輯維持不變
    try {
      const wishlistResponse = await fetch(`${API_BASE_URL}/wishlist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId })
      });
      if (!wishlistResponse.ok) throw new Error('加入待購清單失敗');
      await handleRemoveItem(cartItemId);
      alert('已成功將商品移至待購清單！');
    } catch (error) {
      console.error('移動商品至待購清單時發生錯誤:', error);
      alert('操作失敗，請稍後再試。');
    }
  };

  const handleApplyDiscount = async () => {
    if (!isLoggedIn) {
      alert('請先登入才能使用折扣碼。');
      return;
    }
    // 已登入的邏輯維持不變
    if (!discountCode.trim()) return alert('請輸入折扣碼');
    try {
      const response = await fetch(`${API_BASE_URL}/cart/discount`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ discountCode })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || '套用失敗');
      setCartData(result.data);
      alert('折扣碼已成功套用！');
    } catch (error) {
      console.error('套用折扣碼時發生錯誤:', error);
      alert(error.message);
    }
  };

  // ▲▲▲ 【功能修正】 ▲▲▲
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    if (isLoggedIn) {
      // 已登入：呼叫 API
      const originalCartData = cartData;
      try {
        const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ quantity })
        });
        if (!response.ok) throw new Error('更新數量失敗');
        const result = await response.json();
        if (result.success) {
          setCartData(result.data);
        } else {
          setCartData(originalCartData);
        }
      } catch (error) {
        alert('更新數量失敗，請稍後再試。');
        setCartData(originalCartData);
      }
    } else {
      // 未登入：更新數量後重新計算總價
      let localCart = getLocalCart();
      const itemToUpdate = localCart.items.find(item => item.cartItemId === cartItemId);
      if (itemToUpdate) {
        itemToUpdate.quantity = quantity;
      }
      const recalculatedCart = calculateLocalCartTotals(localCart);
      updateLocalCart(recalculatedCart);
    }
  };

  const sizesList = ['S', 'M', 'L']; // 可根據商品資料調整

  const handleUpdateSize = async (cartItemId, newSizeName) => {
    if (isLoggedIn) {
      // 已登入：呼叫 API 更新尺寸
      try {
        const sizeId = sizesList.indexOf(newSizeName) + 1;
        // --- 修正 PATCH 路徑 ---
        const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ sizeId })
        });
        if (!response.ok) throw new Error('更新尺寸失敗');
        const result = await response.json();
        if (result.success) setCartData(result.data);
      } catch (error) {
        alert('更新尺寸失敗，請稍後再試。');
      }
    } else {
      // 未登入：本地修改
      let localCart = getLocalCart();
      const itemToUpdate = localCart.items.find(item => item.cartItemId === cartItemId);
      if (itemToUpdate) {
        itemToUpdate.size_name = newSizeName;
        itemToUpdate.sizeId = sizesList.indexOf(newSizeName) + 1;
      }
      const recalculatedCart = calculateLocalCartTotals(localCart);
      updateLocalCart(recalculatedCart);
    }
  };

  if (isLoading) return <div className={styles['page-container']}><h1>載入中...</h1></div>;
  if (error && !isLoggedIn) {
    return (
      <div className={styles['page-container']} style={{ textAlign: 'center' }}>
        <h1><i className="fa-solid fa-cart-shopping"></i> 您的購物車</h1>
        <p style={{ marginTop: '2rem' }}>{error}</p>
        <a href="/login-test" className={styles['checkout-btn']} style={{ maxWidth: '300px', margin: '1rem auto' }}>前往登入</a>
      </div>
    );
  }

  if (isLoading) return <div className={styles['page-container']}><h1>載入中...</h1></div>;
  if (error) return <div className={styles['page-container']}><h1>錯誤: {error}</h1></div>;

  // 取得 items 陣列
  const displayData = cartData || { items: [], subtotal: 0, discount: { amount: 0, message: '' }, totalAmount: 0 };
  const { items, subtotal, discount, totalAmount } = displayData;

  return (
    <>
      <div className={styles['page-container']}>
        <header className={`${styles['page-header']} ${styles['mobile-only']}`}>
          <h1>購物車 ({items.length})</h1>
        </header>
        <main className={styles['cart-container']}>
          <section className={styles['cart-items-section']}>
            {/* 這裡的判斷會正確依據 localStorage.token */}
            {!isLoggedIn && (
              <div className={`${styles['login-prompt']} ${styles['desktop-only']}`}>
                <p>登入或創建帳號可以享受更好的購物體驗</p>
                <a href="/home/auth">登入或註冊 &rsaquo;</a>
              </div>
            )}
            <div>
              {items.length > 0 ? (
                items.map(rawItem => {
                  const item = {
                    cartItemId: rawItem.id || rawItem.cartItemId || rawItem.productId || rawItem.product_id, // 優先用 id
                    name: rawItem.name,
                    image_url: rawItem.image_url ? rawItem.image_url.replace('/assets/itemImage/', '/image/itemImage/') : '',
                    quantity: Number(rawItem.quantity),
                    color_name: rawItem.color_name,
                    hex_code: rawItem.hex_code,
                    size_name: rawItem.size_name,
                    price: Number(rawItem.price),
                    productId: rawItem.productId || rawItem.product_id,
                    colorId: rawItem.colorId || rawItem.color_id,
                    sizeId: rawItem.sizeId || rawItem.size_id,
                  };

                  // 若 item.cartItemId 不存在，跳過渲染
                  if (!item.cartItemId) return null;
                  return (
                    <article key={item.cartItemId} className={styles['cart-item']}>
                      <img src={item.image_url} alt={item.name} className={styles['item-image']} />
                      <div className={styles['item-details']}>
                        <h3 className={styles['item-name']}>{item.name}</h3>
                        <div className={styles['quantity-selector-wrapper']}>
                          <span>數量：</span>
                          <select
                            className={styles['quantity-selector']}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.cartItemId, e.target.value)}
                          >
                            {/* 動態產生 1 到 10 的選項 */}
                            {[...Array(10).keys()].map(i => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles['size-selector-wrapper']}>
                          <span>尺寸：</span>
                          <select
                            className={styles['size-selector']}
                            value={item.size_name}
                            onChange={e => handleUpdateSize(item.cartItemId, e.target.value)}
                          >
                            {sizesList.map(sz => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        </div>
                        <p className={styles['item-meta']}>
                          顏色：
                          <span
                            className={styles['item-color-swatch']}
                            style={{ backgroundColor: item.hex_code }}
                          ></span>
                          {item.color_name}
                        </p>
                        <p className={styles['item-price']}>價格：${formatPrice(item.price)}</p>
                        <div className={styles['item-actions']}>
                          {/* <button className={styles['icon-btn']} onClick={() => handleMoveToWishlist(item.productId, item.cartItemId)}><BookmarkIcon /></button> */}
                          <button className={styles['icon-btn']} onClick={() => handleRemoveItem(item.cartItemId)}><DeleteIcon /></button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', width: '100%' }}>您的購物車是空的。</p>
              )}
            </div>
          </section>
          <aside className={styles['order-summary-section']}>
            <h2>訂購明細</h2>
            <div className={styles['summary-details']}>
              <div className={styles['summary-row']}>
                <span>產品金額</span>
                <span>NT${formatPrice(subtotal)}</span>
              </div>
              <div className={styles['summary-row']}>
                <span>運送費用</span>
                <span>$0</span>
              </div>
              <div className={`${styles['summary-row']} ${styles['discount-row']}`} onClick={() => setIsDiscountVisible(prev => !prev)}>
                <span>折扣碼</span>
                <i className={`fa-solid fa-chevron-down ${isDiscountVisible ? styles['icon-rotated'] : ''}`}></i>
              </div>
              {isDiscountVisible && (
                <div className={styles['discount-form-container']}>
                  <input type="text" placeholder="請輸入折扣碼" className={styles['discount-input']} value={discountCode} onChange={e => setDiscountCode(e.target.value)} />
                  <button className={styles['discount-apply-btn']} onClick={handleApplyDiscount}>套用</button>
                </div>
              )}
              {discount && discount.amount > 0 && (
                <div className={styles['summary-row']}>
                  <span>折扣 ({discount.message})</span>
                  <span>-NT${formatPrice(discount.amount)}</span>
                </div>
              )}
              <div id="tax-row-wrapper">
                <div className={styles['summary-row']}>
                  <span>稅金</span>
                  <span>NT$0</span>
                </div>
              </div>
              <hr />
              <div className={`${styles['summary-row']} ${styles['total-row']}`}>
                <span>總計</span>
                <span>NT${formatPrice(totalAmount)}</span>
              </div>
            </div>
            <div className={styles['desktop-only']}>
              <a href="delivery-info" className={styles['checkout-btn']}>結帳</a>
              <div className={styles['additional-info']}>
                <InfoItem title="顧客服務" subtitle="我們在這裡替你解決問題">
                  <p>若您對訂單、商品或網站操作有任何疑問，歡迎隨時透過【線上聊天】或【客服信箱 support@example.com】與我們聯繫。 我們的服務時間為週一至週五 09:00 - 18:00 (國定假日除外)，我們將盡快為您處理。</p>
                </InfoItem>
                <InfoItem title="安全的支付環境" subtitle="我們保護你的個人資料">
                  <p>我們採用全球領先的 SSL (Secure Sockets Layer) 加密技術，確保您在傳輸過程中的所有個人資料與付款資訊都經過最高等級的保護。我們絕不會儲存您的完整卡號，讓您安心購物。</p>
                </InfoItem>
                <InfoItem title="退換貨規則" subtitle="30天內線上與實體商店的退換貨服務">
                  <p>我們提供自您收到商品次日起 30 天內的免費退貨服務。退回的商品必須是全新狀態、未經使用，且完整包含所有原始包裝、吊牌及附件。若要辦理退貨，請登入您的帳戶，在訂單頁面點選「申請退貨」並依照指示操作即可。</p>
                </InfoItem>
              </div>
            </div>
          </aside>
          <div className={`${styles['mobile-actions']} ${styles['mobile-only']}`}>
            <p>30天內免費退貨</p>
            <a href="delivery-info" className={styles['checkout-btn']}>結帳</a>
            <button className={styles['contact-btn']}>聯絡我們</button>
          </div>
        </main>
      </div>
      < Footer />
    </>
  );
};
export default ShoppingCart;
