import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from "../style/search.module.css";

function CategoryButton({ label, onClick }) {
    return (
        <div className={styles.btndiv} onClick={onClick} style={{ cursor: 'pointer' }}>
            <div>
                <h2 className={styles.text_h2}>{label}</h2>
            </div>
        </div>
    );
}

export default function SearchPage() {
    const [categories, setCategories] = useState([]);
    const [seasons, setSeasons] = useState([]); // 新增季型分類 state
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/api/categories').then(res => {
            setCategories(Array.isArray(res.data) ? res.data.map(c => c.name) : []);
        });
        // 新增：取得季型分類
        axios.get('/api/seasons').then(res => {
            setSeasons(Array.isArray(res.data) ? res.data : []);
        });
    }, []);

    const handleSearch = () => {
        if (search.trim()) {
            navigate('/home/itempage', { state: { keyword: search.trim() } });
        }
    };

    return (
        <>
            <main className={styles.search_main}>
                <div className={styles.search_input}>
                    <i></i>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                        placeholder="搜尋商品分類或名稱"
                    />
                    {/* <button onClick={handleSearch}>搜尋</button> */}
                </div>
                <div className={styles.btnlist}>
                    {/* 類別分類 */}
                    {categories.map(label => (
                        <CategoryButton
                            key={label}
                            label={label}
                            onClick={() => navigate('/home/itempage', { state: { keyword: label } })}
                        />
                    ))}
                    {/* 季型分類 */}
                    {seasons.map(season => (
                        <CategoryButton
                            key={season.season_id}
                            label={season.name}
                            onClick={() => navigate('/home/itempage', { state: { season_id: season.season_id, keyword: season.name } })}
                        />
                    ))}
                </div>
                <div className={styles.search_tool2} onClick={() => navigate('/home/itemmagic')}>
                    <span></span>
                    <h5 className={styles.text_h5}>換衣魔法</h5>
                </div>
                <div className={styles.search_tool}>
                    <div className={styles.btn} onClick={() => navigate('/member')}>
                        <p className={styles.text_p}>會員服務</p>
                    </div>
                    <div className={styles.btn} onClick={() => navigate('/brand')}>
                        <p className={styles.text_p}>品牌故事</p>
                    </div>
                    <div className={styles.btn} onClick={() => navigate('/home/skincolor')}>
                        <p className={styles.text_p}>膚色小測驗</p>
                    </div>
                </div>
            </main>
        </>
    )
}