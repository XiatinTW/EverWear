// src/components/WishlistPage/WishlistPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../style/WishlistPage.module.css';
import ProductCard from './ProductCard.jsx';
import Notice from '../components/common/Notice'; // 新增
import Footer from '../components/EriComponts/layout/Footer.jsx';

const CartIcon = ({ onClick }) => (
    <div className={styles.cartIcon} onClick={onClick}>
        <svg xmlns="http://www.w.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
    </div>
);

function WishlistPage(props) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null); // { message, type }
    const navigate = useNavigate();

    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth > 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // --- API 相關 (維持不變) ---
    const API_BASE_URL = 'http://localhost:3000/api/v2';

    // 1. 加入與其他頁面一致的輔助函式
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    };

    const isUserLoggedIn = () => !!localStorage.getItem('token');

    // 2. [改用新API] 建立本地待購清單的輔助函式
    const getLocalWishlist = async () => {
        const localJson = localStorage.getItem('anonymousWishlist');
        let arr = localJson ? JSON.parse(localJson) : [];
        if (arr.length === 0) return arr;
        // 一次查詢所有庫存
        const productId = arr[0].product_id;
        try {
            const res = await fetch(`http://localhost:5173/api/product_stock_by_product_id?product_id=${productId}`);
            const stockArr = await res.json();
            for (let item of arr) {
                const found = stockArr.find(s => Number(s.color_id) === Number(item.color_id) && Number(s.size_id) === Number(item.size_id));
                item.stockQuantity = found ? found.quantity : null;
            }
        } catch (e) {
            for (let item of arr) item.stockQuantity = null;
        }
        return arr;
    };
    const updateLocalWishlist = async (newWishlist) => {
        if (newWishlist.length === 0) {
            localStorage.setItem('anonymousWishlist', JSON.stringify(newWishlist));
            setItems(newWishlist);
            return;
        }
        const productId = newWishlist[0].product_id;
        try {
            const res = await fetch(`http://localhost:3000/api/product_stock_by_product_id?product_id=${productId}`);
            const stockArr = await res.json();
            for (let item of newWishlist) {
                const found = stockArr.find(s => Number(s.color_id) === Number(item.color_id) && Number(s.size_id) === Number(item.size_id));
                item.stockQuantity = found ? found.quantity : null;
            }
        } catch (e) {
            for (let item of newWishlist) item.stockQuantity = null;
        }
        localStorage.setItem('anonymousWishlist', JSON.stringify(newWishlist));
        setItems(newWishlist);
    };

    // 3. [修改] 讀取資料的函式，現在會根據登入狀態決定來源
    const fetchWishlist = async () => {
        setIsLoading(true);
        setError(null);
        if (isUserLoggedIn()) {
            try {
                const response = await fetch(`${API_BASE_URL}/wishlist`, { headers: getAuthHeaders() });
                if (!response.ok) throw new Error('無法獲取資料，請確認您已登入');
                const result = await response.json();
                if (result.success) setItems(result.data);
                else throw new Error(result.message || '無法載入');
            } catch (err) {
                setError(err.message);
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        } else {
            const localWishlist = await getLocalWishlist();
            setItems(localWishlist);
            setIsLoading(false);
        }
    };
    // 4. [修改] 移除商品的函式，現在會根據登入狀態決定操作對象
    const handleRemoveFromWishlist = async (wishlistItemId) => {
        if (isUserLoggedIn()) {
            // 已登入：呼叫 API
            try {
                const response = await fetch(`${API_BASE_URL}/wishlist/${wishlistItemId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                if (!response.ok) throw new Error('移除商品失敗');
                setItems(prevItems => prevItems.filter(item => item.wishlistItemId !== wishlistItemId));
                setNotice({ message: '商品已從待購清單移除。', type: 'success' });
            } catch (err) {
                setNotice({ message: `操作失敗: ${err.message}`, type: 'error' });
            }
            if (props.onWishlistChange) props.onWishlistChange(); // ★即時更新
        } else {
            // 未登入：操作 localStorage
            const localWishlist = await getLocalWishlist();
            const newWishlist = localWishlist.filter(item => item.wishlistItemId !== wishlistItemId);
            await updateLocalWishlist(newWishlist);
            setNotice({ message: '商品已從您的待購清單移除。', type: 'success' });
            if (props.onWishlistChange) props.onWishlistChange(); // ★即時更新
        }
    };

    // 5. 加入購物車的函式 (維持不變，因為它本來就能處理兩種狀態)
    const handleAddToCart = async (productData) => {
        // 【核心修正】
        // 1. 建立物件，欄位名稱必須與後端 API 期待的完全一致
        // 2. 欄位值必須從 productData (也就是 item) 中正確取得
        const cartItem = {
            productId: productData.product_id, // 修正：從 productData.id 改為 productData.product_id
            colorId: productData.color_id,     // 修正：傳送 color_id 而不是 color
            sizeId: productData.size_id,       // 修正：傳送 size_id 而不是 size
            quantity: 1
        };

        if (isUserLoggedIn()) {
            // --- 已登入：呼叫 API ---
            try {
                const response = await fetch(`${API_BASE_URL}/cart/items`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(cartItem) // 傳送修正後的 cartItem
                });
                if (!response.ok) throw new Error('加入購物車失敗');
                setNotice({ message: `已將「${productData.name}」加入購物車！`, type: 'success' });
            } catch (err) {
                setNotice({ message: `操作失敗: ${err.message}`, type: 'error' });
            }
        } else {
            // --- 未登入：操作 localStorage ---
            try {
                const localCartJson = localStorage.getItem('anonymousCart');
                let localCart = localCartJson ? JSON.parse(localCartJson) : { items: [] };

                // 檢查本地購物車中是否已存在相同的商品 (productId, colorId, sizeId)
                const existingItem = localCart.items.find(item =>
                    item.productId === cartItem.productId &&
                    item.colorId === cartItem.colorId &&
                    item.sizeId === cartItem.sizeId
                );

                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    // 將完整的商品資訊與購物車項目資訊結合，存入本地
                    const newItem = {
                        ...productData, // 包含 name, price, image_url 等
                        ...cartItem,    // 包含 productId, colorId, sizeId, quantity
                        cartItemId: `local_${Date.now()}`
                    };
                    localCart.items.push(newItem);
                }

                // (可選) 重新計算本地購物車總價
                localCart.subtotal = localCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                localCart.totalAmount = localCart.subtotal;

                localStorage.setItem('anonymousCart', JSON.stringify(localCart));
                setNotice({ message: `已將「${productData.name}」加入您的購物車！`, type: 'success' });
            } catch (err) {
                setNotice({ message: `操作失敗: ${err.message}`, type: 'error' });
            }
        }
        if (props.onWishlistChange) props.onWishlistChange(); // ★可選：如有需要也可在加入購物車後更新
    };
    useEffect(() => {
        fetchWishlist();
    }, []); // 頁面載入時執行一次


    // ▼▼▼ 【核心修正：純 JavaScript 輪播邏輯】 ▼▼▼
    const [currentIndex, setCurrentIndex] = useState(0); // 1. 用 state 追蹤當前顯示的起始索引
    const itemsPerPage = 3; // 2. 設定桌面版一頁顯示幾張卡片

    // 3. 前往下一頁的函式
    const goToNext = () => {
        // 計算下一頁的起始索引，並確保不會超過邊界
        const nextIndex = Math.min(currentIndex + itemsPerPage, items.length - itemsPerPage);
        setCurrentIndex(nextIndex);
    };

    // 4. 回到上一頁的函式
    const goToPrev = () => {
        // 計算上一頁的起始索引，並確保不會小於 0
        const prevIndex = Math.max(currentIndex - itemsPerPage, 0);
        setCurrentIndex(prevIndex);
    };
    // ▲▲▲ 【核心修正：純 JavaScript 輪播邏輯】 ▲▲▲

    if (isLoading) return <div className={styles.wishlistPage}><p>載入中...</p></div>;
    if (error) return <div className={styles.wishlistPage}><p>錯誤: {error}</p></div>;

    // 5. 根據當前索引，切割出要顯示的商品
    const visibleItems = items.slice(currentIndex, currentIndex + itemsPerPage);

    return (
        <>
            <div className={styles.wishlistPage}>
                <header className={styles.wishlistHeader}>
                    <h1>待購 ({items.length})</h1>
                </header>

                <main>
                    {items.length === 0 ? (
                        <p>您的待購清單目前是空的。</p>
                    ) : (
                        isDesktop ? (
                            items.length > 3 ? (
                                // 桌面版 & 商品 > 3: 顯示 JS 輪播
                                <div className={styles.wishlistCarousel}>
                                    <button onClick={goToPrev} className={styles.carouselButton} disabled={currentIndex === 0}>
                                        &#10094; {/* 左箭頭 */}
                                    </button>
                                    <div className={styles.carouselTrack}>
                                        {visibleItems.map(item => (
                                            <ProductCard key={item.wishlistItemId} item={item} onRemove={handleRemoveFromWishlist} onAddToCart={handleAddToCart} />
                                        ))}
                                    </div>
                                    <button onClick={goToNext} className={styles.carouselButton} disabled={currentIndex >= items.length - itemsPerPage}>
                                        &#10095; {/* 右箭頭 */}
                                    </button>
                                </div>
                            ) : (
                                // 桌面版 & 商品 <= 3: 顯示靜態網格
                                <div className={styles.wishlistGridDesktop}>
                                    {items.map(item => (
                                        <ProductCard key={item.wishlistItemId} item={item} onRemove={handleRemoveFromWishlist} onAddToCart={handleAddToCart} />
                                    ))}
                                </div>
                            )
                        ) : (
                            // 手機版: 永遠顯示換行網格
                            <div className={styles.wishlistGridMobile}>
                                {items.map(item => (
                                    <ProductCard key={item.wishlistItemId} item={item} onRemove={handleRemoveFromWishlist} onAddToCart={handleAddToCart} />
                                ))}
                            </div>
                        )
                    )}
                </main>
                {notice && (
                    <Notice
                        message={notice.message}
                        type={notice.type}
                        onClose={() => setNotice(null)}
                    />
                )}
            </div>
            <Footer />
        </>
    );
}

export default WishlistPage;
