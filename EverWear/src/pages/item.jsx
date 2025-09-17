import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import '../style/itempage.css';
import Notice from '../components/common/Notice'; // 新增
import SizeBox from '../components/common/sizebox'; // 新增
import Footer from '../components/EriComponts/layout/Footer.jsx';

const images = [
    '/item/image1.png',
    '/item/image2.png',
    '/item/image3.png',
    '/item/image4.png'
];

const moreItems = [
    {
        img: '/item/O_ADJ_01_DG_Ｆ.png',
        name: '三口袋羽絨外套',
        color: '#5F6031',
        price: 68000
    },
    {
        img: '/item/O_WR_01_AL_F.png',
        name: '落肩綁帶外套',
        color: '#FBDAB9',
        price: 42000
    },
    {
        img: '/item/O_SDJ_01_S_F.png',
        name: '衍縫外套',
        color: '#E3CBAD',
        price: 36000
    },
    {
        img: '/item/O_G_01_CM_F.png',
        name: '絨毛背心',
        color: '#E3CBAD',
        price: 48000
    }
];

function ColorBox({ name, currentColor, onSelect }) {
    const [colorItems, setColorItems] = useState([]);

    useEffect(() => {
        if (name) {
            axios.get(`/api/items/byname?name=${encodeURIComponent(name)}`).then(res => {
                setColorItems(Array.isArray(res.data) ? res.data : []);
            });
        }
    }, [name]);

    return (
        <div className="colorboxList">
            {colorItems.map((item, idx) => (
                <div
                    key={item.colors?.[0]?.hex_code || idx}
                    className="colorbox"
                    style={{
                        backgroundColor: item.colors?.[0]?.hex_code || '#eee'
                    }}
                    onClick={() => onSelect(item)}
                    title={item.colors?.[0]?.name}
                />
            ))}
        </div>
    );
}

export default function ItemPage() {
    const location = useLocation();
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product_id');
    const itemStr = params.get('item');

    const [item, setItemRaw] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState(null); // { message, type }
    const [wishlist, setWishlist] = useState([]); // 新增
    const [showSizeBox, setShowSizeBox] = useState(false); // 新增

    // 處理 item 欄位格式，確保 images/colors/charactor/material 都有預設值
    const itemSafe = React.useMemo(() => {
        if (!item) return {};
        return {
            ...item,
            images: Array.isArray(item.images) ? item.images.map(src =>
                typeof src === 'string' ? src.replace('/assets/itemImage/', '/image/itemImage/') : src
            ) : [],
            colors: Array.isArray(item.colors) ? item.colors : [],
            charactor: typeof item.charactor === 'string' ? item.charactor : JSON.stringify(item.charactor || []),
            material: typeof item.material === 'string' ? item.material : JSON.stringify(item.material || []),
            price: item.price || 0,
            name: item.name || '',
            description: item.description || '',
            description_long: item.description_long || ''
        };
    }, [item]);

    const [qty, setQty] = useState(1);
    const [selectedSize, setSelectedSize] = useState('S');
    const [showCommunityLinks, setShowCommunityLinks] = useState(true);
    const communityLinksRef = React.useRef(null);
    const linkBtnRef = React.useRef(null);
    const sizes = ['S', 'M', 'L'];
    const [moreItems, setMoreItems] = useState([]);

    // menu 滾動隱藏
    const [menuHidden, setMenuHidden] = useState(false);
    const [mainReady, setMainReady] = useState(false);
    const mainRef = React.useRef(null);

    useEffect(() => {
        if (mainRef.current) setMainReady(true);
    }, []);

    useEffect(() => {
        if (!mainReady || !mainRef.current) return;
        const onScroll = () => {
            if (mainRef.current.scrollTop > 600) {
                setMenuHidden(true);
            } else {
                setMenuHidden(false);
            }
        };
        mainRef.current.addEventListener('scroll', onScroll);
        return () => mainRef.current && mainRef.current.removeEventListener('scroll', onScroll);
    }, [mainReady]);

    React.useEffect(() => {
        const handleClick = (e) => {
            if (
                communityLinksRef.current &&
                !communityLinksRef.current.contains(e.target) &&
                linkBtnRef.current &&
                !linkBtnRef.current.contains(e.target)
            ) {
                setShowCommunityLinks(true);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // 取得探索更多商品
    useEffect(() => {
        axios.get('/api/items')
            .then(res => {
                setMoreItems(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
            })
            .catch(err => {
                console.error('取得商品失敗', err);
            });
    }, []);

    // 切換顏色時更新商品資料
    const handleColorSelect = (newItem) => {
        setItemRaw(newItem);
    };

    // 加入待購清單的函式
    const handleAddToWishlist = () => {
        // 取得商品資料
        const wishlistItem = {
            product_id: itemSafe.product_id,
            name: itemSafe.name,
            price: itemSafe.price,
            image_url: itemSafe.images?.[itemSafe.images.length - 1] || '/item/image1.png',
            color_id: itemSafe.colors?.[0]?.color_id || 1,
            color_name: itemSafe.colors?.[0]?.name || '',
            hex_code: itemSafe.colors?.[0]?.hex_code || '',
            size_id: itemSafe.sizes ? itemSafe.sizes.indexOf(selectedSize) + 1 : 1,
            size_name: selectedSize
        };

        // 判斷是否登入（這裡用 localStorage.token 判斷）
        const token = localStorage.getItem('token');
        if (token) {
            // 已登入，呼叫 API
            axios.post('http://localhost:3000/api/v2/wishlist', {
                productId: wishlistItem.product_id,
                colorId: wishlistItem.color_id,
                sizeId: wishlistItem.size_id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
                setNotice({ message: '已加入待購清單。', type: 'success' });
            }).catch(() => {
                setNotice({ message: '加入待購清單失敗！', type: 'error' });
            });
        } else {
            // 未登入，存 localStorage
            const localJson = localStorage.getItem('anonymousWishlist');
            const arr = localJson ? JSON.parse(localJson) : [];
            // 檢查是否已存在同商品同色同尺寸
            const exists = arr.find(i =>
                i.product_id === wishlistItem.product_id &&
                i.color_id === wishlistItem.color_id &&
                i.size_id === wishlistItem.size_id
            );
            if (!exists) {
                arr.push({
                    ...wishlistItem,
                    wishlistItemId: `local_${Date.now()}`
                });
                localStorage.setItem('anonymousWishlist', JSON.stringify(arr));
                setNotice({ message: '已加入您的待購清單。', type: 'success' });
            } else {
                setNotice({ message: '此商品已在待購清單！', type: 'info' });
            }
        }
    };

    // 加入購物車的函式
    const handleAddToCart = () => {
        const cartItem = {
            productId: itemSafe.product_id,
            colorId: itemSafe.colors?.[0]?.color_id || 1,
            sizeId: itemSafe.sizes ? itemSafe.sizes.indexOf(selectedSize) + 1 : 1,
            quantity: qty
        };
        const token = localStorage.getItem('token');
        console.log(token);

        if (token) {
            // 已登入，呼叫 API，只傳 ID，資料會寫入 cart_items 表
            axios.post('http://localhost:3000/api/v2/cart/items', cartItem, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
                setNotice({ message: '已加入購物車。', type: 'success' });
            }).catch(() => {
                setNotice({ message: '加入購物車失敗！', type: 'error' });
            });
        } else {
            // 未登入，存 localStorage
            // newItem 會包含商品所有資訊（如圖片、顏色、尺寸、名稱、數量）
            const newItem = {
                ...itemSafe, // 包含 images, colors, name, price 等
                ...cartItem,
                cartItemId: `local_${Date.now()}`,
                name: itemSafe.name,
                image_url: itemSafe.images?.[itemSafe.images.length - 1] || '/item/image1.png',
                size_name: selectedSize,
                color_name: itemSafe.colors?.[0]?.name || '',
                hex_code: itemSafe.colors?.[0]?.hex_code || '',
                quantity: qty
            };
            const localCartJson = localStorage.getItem('anonymousCart');
            let localCart = localCartJson ? JSON.parse(localCartJson) : { items: [] };
            // 檢查本地購物車中是否已存在相同的商品 (productId, colorId, sizeId)
            const existingItem = localCart.items.find(item =>
                item.productId === cartItem.productId &&
                item.colorId === cartItem.colorId &&
                item.sizeId === cartItem.sizeId
            );
            if (existingItem) {
                existingItem.quantity += qty;
            } else {
                localCart.items.push(newItem);
            }
            localCart.subtotal = localCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            localCart.totalAmount = localCart.subtotal;
            localStorage.setItem('anonymousCart', JSON.stringify(localCart));
            setNotice({ message: '已加入您的購物車。', type: 'success' });
        }
    };

    // 判斷是否已在待購清單
    const isWishlisted = wishlist.some(i =>
        i.product_id === itemSafe.product_id &&
        (i.color_id === itemSafe.colors?.[0]?.color_id || i.color_id === undefined) &&
        (i.size_id === (itemSafe.sizes ? itemSafe.sizes.indexOf(selectedSize) + 1 : 1) || i.size_id === undefined)
    );

    // 商品切換時重設 qty
    useEffect(() => {
        setQty(1);
    }, [itemSafe.product_id]);

    // 進入頁面時，根據 product_id 或 item query 取得商品資料
    useEffect(() => {
        setLoading(true);
        if (productId) {
            axios.get(`/api/items?product_id=${productId}`).then(res => {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setItemRaw(data || null);
                setLoading(false);
            }).catch(() => {
                setItemRaw(null);
                setLoading(false);
            });
        } else if (itemStr) {
            try {
                setItemRaw(JSON.parse(itemStr));
            } catch {
                setItemRaw(location.state?.item);
            }
            setLoading(false);
        } else {
            setItemRaw(location.state?.item);
            setLoading(false);
        }
    }, [productId, itemStr, location.state]);

    // 取得待購清單（本地或 API）
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get('http://localhost:3000/api/v2/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setWishlist(Array.isArray(res.data.data) ? res.data.data : []);
            }).catch(() => setWishlist([]));
        } else {
            const localJson = localStorage.getItem('anonymousWishlist');
            setWishlist(localJson ? JSON.parse(localJson) : []);
        }
    }, [itemSafe.product_id, notice]);

    // 畫面渲染
    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>載入中...</div>;
    }
    if (!itemSafe.name) {
        return <div style={{ padding: 40, textAlign: 'center' }}>查無商品</div>;
    }

    return (
        <>
            <main className="item_main" ref={mainRef}>
                <div className="main">
                    <div className="itemsListimage">
                        {itemSafe.images.length > 0
                            ? itemSafe.images.map((src, i) => (
                                <img key={i} className="img" src={src} alt={`商品圖片${i + 1}`} />
                            ))
                            : images.map((src, i) => (
                                <img key={i} className="img" src={src} alt={`商品圖片${i + 1}`} />
                            ))
                        }
                    </div>
                    <div className="div">
                        <div className="title">
                            <div>
                                <h3 className="text-h3">{itemSafe.name || '側釦口袋T恤'}</h3>
                                <h5 className="text-h5">
                                    ${itemSafe.price ? Number(itemSafe.price).toLocaleString() : '7,500'}
                                </h5>
                            </div>
                            <div className="text-p">
                                {itemSafe.description || '極簡與柔和色調交織，經典 boxy 剪裁與胸前口袋設計，呈現日系穿搭的低調質感。袖口織標細節低語品牌語彙，適合單穿或內搭，為每日造型注入留白與品味。'}
                            </div>
                        </div>
                        <menu
                            id="menu"
                            className={`menu${menuHidden ? ' hide' : ''}`}
                        >
                            <div>
                                <div className="options">
                                    <div className="sizes">
                                        <div className="sizebox">
                                            {sizes.map(size => (
                                                <div
                                                    key={size}
                                                    className={`smXL-wrapper${selectedSize === size ? ' hide' : ''}`}
                                                    onClick={() => setSelectedSize(size)}
                                                >
                                                    <div className="m">{size}</div>
                                                </div>
                                            ))}
                                            <div id="sizebutton" onClick={() => setShowSizeBox(true)}>
                                                <span className='icon straighten'></span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 用 ColorBox 元件顯示所有顏色 */}
                                    <ColorBox
                                        name={itemSafe.name}
                                        currentColor={itemSafe.colors?.[0]?.hex_code}
                                        onSelect={handleColorSelect}
                                    />
                                </div>
                                <div className="actions">
                                    <div className="qty">
                                        <div className="quantity-input">
                                            <div className="SVG-wrapper">
                                                <span id="qty_add" className='icon remove' onClick={() => setQty(qty > 1 ? qty - 1 : 1)}></span>
                                            </div>
                                            <div className="input-product">
                                                <div className="div-wrapper">
                                                    <div
                                                        id="qty_value"
                                                        className="text-p"
                                                        style={{ color: 'var(--color-secondary_1)' }}
                                                    >
                                                        {qty}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="SVG-wrapper">
                                                <span id="qty_add" className='icon add' onClick={() => setQty(qty + 1)}></span>
                                            </div>
                                        </div>
                                        <div className="SVG-wrapper">
                                            {/* bookmarkicon 加入 hover 狀態 */}
                                            <span
                                                className={`icon bookmarkicon${isWishlisted ? ' hover' : ''}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={handleAddToWishlist}
                                            ></span>
                                        </div>
                                    </div>
                                    <button className="button" onClick={handleAddToCart}>
                                        <div className="text-p" style={{ color: 'var(--color-secondary_1)' }}>
                                            加入購物車
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div className="product-tools">
                                    <div>
                                        <span className='icon Vector2'></span>
                                        <div className="text-p">專人諮詢</div>
                                    </div>
                                    <div>
                                        <span className='icon Vector'></span>
                                        <div id="Linkbtn" className="text-p"
                                            ref={linkBtnRef}
                                            onClick={e => {
                                                setShowCommunityLinks(false);
                                                e.stopPropagation();
                                            }}
                                        >
                                            分享連結
                                        </div>
                                    </div>
                                    <div
                                        className={`CommunityLinks${showCommunityLinks ? '' : ' hide'}`}
                                        ref={communityLinksRef}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <span className="facebook"></span>
                                        <span className="instagram"></span>
                                        <span className="youtube"></span>
                                    </div>
                                </div>
                            </div>
                        </menu>
                    </div>
                </div>
                <div className="main_2">
                    <div className="Description">
                        <div>
                            <p className="text-p">
                                {itemSafe.description_long ||
                                    '這款基本款圓領 T-shirt，兼具接觸涼感與細緻光澤，為每日穿搭提供剛好的質感基底。使用高等級 Supima Cotton（超長纖維棉），擁有輕盈滑順的質地與自然挺度，貼膚舒適，適合長時間穿著。'}
                            </p>
                            <div className="view-3">
                                <h6 className="text-h6">購買須知</h6>
                                <p className="text-p">※ 商品為限量販售，網站與門市同步更新，若有缺貨將另行通知，敬請見諒。&nbsp;&nbsp;<br />※
                                    圖片顏色可能略有差異，實際請以實品為準，感謝理解。</p>
                            </div>
                        </div>
                        <div className="characteristics">
                            <div>
                                <h6 className="text-h6">特性</h6>
                                <ul className="text-p">
                                    {itemSafe.charactor
                                        ? JSON.parse(itemSafe.charactor).map((c, i) => <li key={i}>{c}</li>)
                                        : (
                                            <>
                                                <li>無透感</li>
                                                <li>無內裡設計</li>
                                                <li>適度彈性</li>
                                            </>
                                        )
                                    }
                                </ul>
                            </div>
                            <div>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="text-p">材質：</td>
                                            <td className="text-p">
                                                {itemSafe.material
                                                    ? JSON.parse(itemSafe.material).join('、')
                                                    : '100% 純棉（綿）'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-p">原產地：</td>
                                            <td className="text-p">台灣製</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="text-12">※ 洗滌前請參考商品吊牌說明，避免變形與縮水。</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="main_3">
                    <div className="text-h1">探索更多</div>
                    <div className="projects">
                        {moreItems.map((item, i) => (
                            <div
                                className="item"
                                key={item.product_id || i}
                                style={{ cursor: 'pointer' }}
                                onClick={() => window.location.assign(`/home/item?product_id=${item.product_id}`)}
                            >
                                <img
                                    className="rectangle"
                                    src={item.images?.[item.images.length - 1]?.replace('/assets/itemImage/', '/image/itemImage/') || '/item/image1.png'}
                                    alt={item.name}
                                />
                                <div>
                                    <p className="text-p" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</p>
                                    <div className="item_color" style={{ backgroundColor: item.colors?.[0]?.hex_code || '#eee' }}></div>
                                    <p className="text-p">
                                        價格：{item.price ? Number(item.price).toLocaleString() : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {notice && (
                    <Notice
                        message={notice.message}
                        type={notice.type}
                        onClose={() => setNotice(null)}
                    />
                )}
                {showSizeBox && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SizeBox size={`/image/size/${itemSafe.size_url}`} onClose={() => setShowSizeBox(false)} />
                    </div>
                )}
                <Footer />
            </main>
        </>
    );
}
