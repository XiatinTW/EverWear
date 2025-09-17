import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/itempage.css';
import Footer from '../components/EriComponts/layout/Footer.jsx';

const sortOptions = [
    { value: 'default', label: '排序' },
    { value: 'price-asc', label: '價格由低到高' },
    { value: 'price-desc', label: '價格由高到低' },
    { value: 'newest', label: '最新上市' }
];

function sortItems(items, sortType) {
    switch (sortType) {
        case 'price-asc':
            return [...items].sort((a, b) => a.price - b.price);
        case 'price-desc':
            return [...items].sort((a, b) => b.price - a.price);
        case 'newest':
            return [...items]; // 假設原始順序即為最新
        default:
            return [...items];
    }
}

function ItemCard({ item }) {
    const [current, setCurrent] = useState(0);
    const timerRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % item.images.length);
        }, 2500);
        return () => clearInterval(timerRef.current);
    }, [item.images.length]);

    return (
        <div
            className="item"
            onClick={() => navigate(`/home/item?product_id=${item.product_id}`)}
            style={{ cursor: 'pointer' }}
        >
            <div className="stack">
                {item.images.map((img, i) => (
                    <div
                        className="card"
                        key={img}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'transparent',
                            border: 'none',
                            transition: 'transform 0.8s',
                            transform: i === current ? 'rotateY(0deg)' : 'rotateY(180deg)',
                            zIndex: i === current ? 2 : 0,
                            visibility: i === current ? 'visible' : 'hidden'
                        }}
                    >
                        <img
                            src={img.replace('/assets/itemImage/', '/image/itemImage/')}
                            alt=""
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                ))}
            </div>
            <div>
                <p className="text-p" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</p>
                <div
                    className="item_color"
                    style={{
                        backgroundColor: item.colors?.[0]?.hex_code || item.color || '#eee'
                    }}
                ></div>
                <p className="text-p">
                    價格：{Number(item.price).toLocaleString()}
                </p>
            </div>
        </div>
    );
}
// 關鍵字對應表key 和 value
const keywordMap = {
    '外套': 'OUTERWEAR',
    '上衣': 'T-SHIRTS',
    '裙子': 'SKIRTS',
    '褲子': 'TROUSERS',
    '清新春日': 'FRESH SPRING',
    '熱情夏日': 'HOT SUMMER',
    '溫暖秋日': 'WARM AUTUMN',
    '靜謐冬日': 'SERENE WINTER'
};

function getKeywordClass(keyword) {
    return keywordMap[keyword] ? keywordMap[keyword] : 'Fashion';
    
}

export default function ItemPage() {
    const [items, setItems] = useState([]);
    const [sortType, setSortType] = useState('default');
    const [showOptions, setShowOptions] = useState(false);
    const selectRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const keyword = location.state?.keyword || '';
    const seasonId = location.state?.season_id || null;

    useEffect(() => {
        if (seasonId) {
            axios.get('/api/recommend_products', { params: { season_id: seasonId } }).then(res => {
                // 直接用後端回傳的 images
                setItems(Array.isArray(res.data) ? res.data : []);
            });
        } else if (keyword) {
            axios.get('/api/items/search', { params: { keyword } }).then(res => {
                setItems(Array.isArray(res.data) ? res.data : []);
            });
        } else {
            axios.get('/api/items').then(res => {
                setItems(Array.isArray(res.data) ? res.data : []);
            });
        }
    }, [keyword, seasonId]);

    // 點擊外部自動關閉選單
    useEffect(() => {
        function handleClickOutside(e) {
            if (selectRef.current && !selectRef.current.contains(e.target)) {
                setShowOptions(false);
            }
        }
        if (showOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions]);

    const sortedItems = sortItems(items, sortType);

    return (
        <>
            <div className="itemall_main">
                <div className={`advertisement ${getKeywordClass(keyword)}`}></div>
                <h1 className="text-h1" style={{ position: 'absolute', left: 10, top: 294, color: 'rgba(255,255,255,0.80)' }}>
                    {keywordMap[keyword] || keyword || 'Fashion'}
                </h1>
                <div className="topobject">
                    <div className="path">
                        <a className="text-p">首頁</a>
                        <span className='icon right'></span>
                        <a className="text-p">{keyword || '全部商品'}</a>
                    </div>
                    <div
                        id="selectbtn"
                        className="select sorting text-p"
                        tabIndex={0}
                        ref={selectRef}
                        onClick={() => setShowOptions(v => !v)}
                        style={{ position: 'relative', cursor: 'pointer' }}
                    >
                        <div>
                            <div className="selected">{sortOptions.find(opt => opt.value === sortType)?.label}</div>
                            <span>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <path d="M7 11L14 18L21 11" stroke="#4E3E31" strokeWidth="2.5" strokeLinecap="round"
                                        strokeLinejoin="round" />
                                </svg>
                            </span>
                        </div>
                        {showOptions && (
                            <div className="options" style={{
                                display: 'block',
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                background: 'var(--color-base_text_1)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                zIndex: 10
                            }}>
                                {sortOptions.map(opt => (
                                    <div
                                        className="option"
                                        key={opt.value}
                                        data-value={opt.value}
                                        style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--color-secondary_1)' }}
                                        onMouseDown={() => {
                                            setSortType(opt.value);
                                            setShowOptions(false);
                                        }}
                                    >
                                        {opt.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="main" style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {sortedItems.length === 0 ? (
                        <div style={{ width: '100%', textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '1.2em' }}>
                            查無商品
                        </div>
                    ) : (
                        sortedItems.map((item, idx) => (
                            <ItemCard item={item} key={idx} />
                        ))
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}