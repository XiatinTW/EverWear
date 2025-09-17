// src/components/WishlistPage/ProductCard.jsx

import React from 'react';
import styles from '../style/ProductCard.module.css';

// 我們將 props 直接在函式參數中解構，讓程式碼更簡潔
function ProductCard({ item, onRemove, onAddToCart }) {

  // 將 SVG 圖示也變成一個小元件，讓 JSX 更乾淨
  const BookmarkIcon = () => (
    <svg className={styles.bookmarkIcon} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px">
        <path style={{fill: 'var(--color-base_text_2)'}} d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </svg>
  );

  return (
    <div className={styles.productCard}>
     <div className={styles.productImageContainer}>
      <img
        src={
          item.image_url
            ? item.image_url.startsWith('/assets/itemImage/')
              ? item.image_url.replace('/assets/itemImage/', '/image/itemImage/')
              : item.image_url
            : ''
        }
        alt={item.name}
        style={{ cursor: 'pointer' }}
        onClick={() => window.location.assign(`/home/item?product_id=${item.product_id}`)}
      />
    </div>

      <div className={styles.productInfo}>
        <div className={styles.warningPlaceholder}>
          {/* ▼▼▼ 【核心修正】 ▼▼▼ */}
          {item.stockQuantity === 1 && (
          <span className={styles.stockWarning}>庫存剩下一件</span>
        )}
          {/* ▲▲▲ 【核心修正】 ▲▲▲ */}
        </div>

        <div className={styles.productTitle}>
          <h2>{item.name}</h2>
          <button
            className={styles.wishlistBtn}
            aria-label="從待購清單移除"
            // 當按鈕被點擊時，呼叫從 props 傳入的 onRemove 函式，並將 wishlistItemId 傳給它
            onClick={() => onRemove(item.wishlistItemId)}
          >
            <BookmarkIcon />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className={styles.colorSwatch} style={{ backgroundColor: item.hex_code }}></span>
          <p className='text-p'>{item.color_name}</p>
        </div>
        <p className={styles.productDetail}>尺寸：{item.size_name}</p>
        <p className={styles.productPrice}>價格：${new Intl.NumberFormat().format(Math.trunc(item.price))}</p>
      </div>

      <button
        className={styles.addToCartBtn}
        // 當按鈕被點擊時，呼叫從 props 傳入的 onAddToCart 函式，並將整個 item 物件傳給它
        onClick={() => onAddToCart(item)}
      >
        加入購物車
      </button>
    </div>
  );
}

export default ProductCard;