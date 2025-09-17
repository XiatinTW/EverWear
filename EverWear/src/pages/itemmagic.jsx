import React, { useState, useEffect, useRef } from 'react';
import LoadHelp from '../components/common/loadhelp';
import Item from '../components/Item'; // 新增元件
import '../style/itemmagic.css';

function ItemMagic() {
    const videoRef = useRef(null);
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);
    const [imgSrc, setImgSrc] = useState('');
    const [mode, setMode] = useState(''); // 'camera' | 'upload' | ''
    const [showHelp, setShowHelp] = useState(true);
    const [menuHide, setMenuHide] = useState(false);
    const [topHide, setTopHide] = useState(false);   // 默認不收合
    const [coatHide, setCoatHide] = useState(false);
    const [menuMdHide, setMenuMdHide] = useState(false);
    const [selectedItemImg, setSelectedItemImg] = useState(''); // 選取的 item 圖片
    const [selectedItemType, setSelectedItemType] = useState(''); // 'top' | 'coat' | ''
    const [loadingText, setLoadingText] = useState(''); // 新增狀態
    const [downloadUrl, setDownloadUrl] = useState(''); // 新增狀態
    const [showSphere, setShowSphere] = useState(false); // 球體效果顯示狀態
    const [topItems, setTopItems] = useState([]); // 上衣
    const [coatItems, setCoatItems] = useState([]); // 外套

    useEffect(() => {
        // 啟用攝影機
        async function enableCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (err) {
                // 攝影機啟用失敗
            }
        }
        enableCamera();
        return () => {
            // 關閉攝影機
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleTakePhoto = () => {
        if (!videoRef.current) return;
        // 依 video 實際寬高設定 canvas
        const video = videoRef.current;
        const videoWidth = video.videoWidth || video.offsetWidth;
        const videoHeight = video.videoHeight || video.offsetHeight;
        const canvas = document.createElement('canvas');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setImgSrc(dataUrl);
        setMode('camera');
    };

    const handleUploadPhoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImgSrc(ev.target.result);
                setMode('upload');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRetake = () => {
        setImgSrc('');
        setMode('');
        setDownloadUrl('');
        setShowSphere(false);
        setSelectedItemImg('');
        setSelectedItemType('');
        setLoadingText('');
        // 若是重新拍照，video 顯示
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    useEffect(() => {
        // 取得所有商品
        async function fetchProducts() {
            try {
                const res = await fetch('/api/items');
                const products = await res.json();
                // 根據分類分組
                const tops = [];
                const coats = [];
                for (const prod of products) {
                    const imgSrc = prod.images && prod.images.length > 0 ? prod.images[prod.images.length - 1] : '';
                    // 根據 category_id 或 name 判斷
                    if (prod.category_id === 't-shirts' || prod.name === '上衣') {
                        tops.push({ imgSrc, type: 'top', key: prod.product_id, name: prod.name });
                    } else if (prod.category_id === 'outerwear' || prod.name === '外套') {
                        coats.push({ imgSrc, type: 'coat', key: prod.product_id, name: prod.name });
                    }
                }
                setTopItems(tops);
                setCoatItems(coats);
            } catch (err) {
                // 可加錯誤提示
            }
        }
        fetchProducts();
    }, []);

    // 單選邏輯：只會有一個 item 被選擇
    const handleItemClick = (imgSrc, type, key) => {
        if (selectedItemType === key) {
            setSelectedItemImg('');
            setSelectedItemType('');
        } else {
            setSelectedItemImg(imgSrc);
            setSelectedItemType(key);
        }
    };

    const handleSubmitPhoto = async () => {
        if (!imgSrc) {
            alert('請先拍照或上傳人臉');
            return;
        }
        if (!selectedItemImg) {
            alert('請選擇上衣');
            return;
        }
        setLoadingText('AI繪圖程序中 請稍後(預估約1分鐘)');
        setShowSphere(true); // 顯示球體效果
        // 送出照片與 item 圖片
        const formData = new FormData();
        // 人臉照
        const faceBlob = await (await fetch(imgSrc)).blob();
        formData.append('image_face', faceBlob, 'face.png');
        // 上衣/外套圖
        const clothBlob = await (await fetch(selectedItemImg)).blob();
        formData.append('image_cloth', clothBlob, 'cloth.png');

        try {
            const workurl = 'https://9b417feb5975.ngrok-free.app/webhook/82005c20-316b-4b8e-80c1-bed7f1e405b9';//banana
            // 一般版的演算 https://502ebca9c095.ngrok-free.app/webhook/65001ff7-142d-4158-a9ef-73fe76098cf1
            // API NaNobanana 版的演算 https://502ebca9c095.ngrok-free.app/webhook/82005c20-316b-4b8e-80c1-bed7f1e405b9
            const postPromise = fetch(workurl, {
                method: 'POST',
                body: formData
            });
            await new Promise(r => setTimeout(r, 60000));
            const postRes = await postPromise;
            if (!postRes.ok) throw new Error('POST webhook 回應失敗');
            // 顯示 API 回傳圖片
            const imageBlob = await postRes.blob();
            const imageObjectURL = URL.createObjectURL(imageBlob);
            setImgSrc(imageObjectURL);
            setDownloadUrl(imageObjectURL);
            setLoadingText('');
            setShowSphere(false); // 隱藏球體效果
            setMode('');
            setSelectedItemImg('');
            setSelectedItemType('');
            alert('畫好了！ 難免會畫醜請見諒!');
        } catch (err) {
            setLoadingText('');
            setShowSphere(false); // 隱藏球體效果
            alert('操作失敗');
        }
    };

    const handleDownload = () => {
        if (!downloadUrl) return;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'ai_result.png';
        a.click();
    };

    const handleTopClick = () => {
        setTopHide(h => !h);
        // 不影響 coatHide
    };

    const handleCoatClick = () => {
        setCoatHide(h => !h);
        // 不影響 topHide
    };

    useEffect(() => {
        if (!showSphere) return;
        // 球體效果程式碼
        const CONFIG = {
            particles: 300,
            maxLinkDist: 90,
            speed: 0.4,
            radiusRatio: 0.42,
            lineWidth: 0.7,
            dotSize: [0.8, 2.0],
            color: 'rgba(78, 62, 49,',
            mouseForce: 10
        };
        const canvas = document.getElementById('scene');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let DPR = Math.max(1, window.devicePixelRatio || 1);

        const sphere = { cx:0, cy:0, r:0 };
        const particles = [];
        let mouse = { x:null, y:null };

        function resize(){
            // 取得 canvas 父層 div 的寬高
            const parent = canvas.parentElement;
            const w = parent.offsetWidth, h = parent.offsetHeight;
            canvas.width = w * DPR;
            canvas.height = h * DPR;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(DPR,0,0,DPR,0,0);

            const s = Math.min(w,h);
            sphere.r = s * CONFIG.radiusRatio;
            sphere.cx = w/2;
            sphere.cy = h/2;
        }

        function rand(min,max){ return min + Math.random()*(max-min); }
        function randomPointInCircle(r){
            const t = Math.random() * Math.PI * 2;
            const u = Math.sqrt(Math.random());
            return { x: r*u*Math.cos(t), y: r*u*Math.sin(t) };
        }
        function keepInside(p){
            const dx = p.x - sphere.cx;
            const dy = p.y - sphere.cy;
            const d = Math.hypot(dx,dy);
            if (d > sphere.r){
                const nx = dx/d, ny = dy/d;
                p.x = sphere.cx + nx * sphere.r;
                p.y = sphere.cy + ny * sphere.r;
                const dot = p.vx*nx + p.vy*ny;
                p.vx -= 2*dot*nx; p.vy -= 2*dot*ny;
                p.vx *= 0.9; p.vy *= 0.9;
            }
        }
        function resetParticles(){
            particles.length = 0;
            for (let i=0;i<CONFIG.particles;i++){
                const {x,y} = randomPointInCircle(sphere.r*0.95);
                particles.push({
                    x: sphere.cx + x,
                    y: sphere.cy + y,
                    vx: rand(-1,1)*CONFIG.speed,
                    vy: rand(-1,1)*CONFIG.speed,
                    r: rand(CONFIG.dotSize[0], CONFIG.dotSize[1])
                });
            }
        }
        function step(){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.save();
            ctx.beginPath();
            ctx.arc(sphere.cx, sphere.cy, sphere.r, 0, Math.PI*2);
            ctx.clip();
            for (const p of particles){
                if (mouse.x!==null){
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const d = Math.hypot(dx,dy);
                    if (d < CONFIG.mouseForce){
                        const force = (1 - d/CONFIG.mouseForce) * 2;
                        p.vx += (dx/d) * force;
                        p.vy += (dy/d) * force;
                    }
                }
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 1;
                p.vy *= 1;
                keepInside(p);
            }
            ctx.lineWidth = CONFIG.lineWidth;
            for (let i=0;i<particles.length;i++){
                const a = particles[i];
                for (let j=i+1;j<particles.length;j++){
                    const b = particles[j];
                    const dx = a.x-b.x, dy = a.y-b.y;
                    const d = Math.hypot(dx,dy);
                    if (d < CONFIG.maxLinkDist){
                        ctx.strokeStyle = CONFIG.color + (1-d/CONFIG.maxLinkDist)*0.9 + ')';
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            for (const p of particles){
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
                ctx.fillStyle = CONFIG.color+'1)';
                ctx.fill();
            }
            ctx.restore();
            if (showSphere) requestAnimationFrame(step);
        }
        resize();
        resetParticles();
        step();

        window.addEventListener('resize', ()=>{ resize(); resetParticles(); });
        window.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
        window.addEventListener('mouseleave', ()=>{ mouse.x=null; mouse.y=null; });

        return () => {
            // 清理事件與動畫
            window.removeEventListener('resize', ()=>{ resize(); resetParticles(); });
            window.removeEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
            window.removeEventListener('mouseleave', ()=>{ mouse.x=null; mouse.y=null; });
        };
    }, [showSphere]);

    return (
        <>
            {showHelp && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <LoadHelp onAgree={() => setShowHelp(false)} />
                </div>
            )}
            <main className="itemmagic_main">
                <div className={`itemmagic_menu${menuMdHide ? ' hide' : ''}`}>
                    <div
                        className={`itemmagic_md${menuMdHide ? ' hide' : ''}`}
                        onClick={() => setMenuMdHide(h => !h)}
                    >
                        <span className='icon arrow_drop_down_circle'></span>
                    </div>
                    <div className='itemmagic_sd'>
                        <div
                            className={`itembtn${topHide ? ' hide' : ''}`}
                            onClick={handleTopClick}
                        >
                            <span className='icon apparel'></span>
                            <h6 className='text-h6'>上衣</h6>
                        </div>
                        <div
                            className={`itembtn${coatHide ? ' hide' : ''}`}
                            onClick={handleCoatClick}
                        >
                            <span className='icon apparel'></span>
                            <h6 className='text-h6'>外套</h6>
                        </div>
                    </div>
                </div>
                <div
                    id='itemmagic_top'
                    className={`item_details${topHide ? ' hide' : ''}`}
                >
                    {topItems.map(item => (
                        <Item
                            key={item.key}
                            hide={topHide}
                            imgSrc={item.imgSrc}
                            selected={selectedItemType === item.key}
                            onClick={() => handleItemClick(item.imgSrc, item.type, item.key)}
                        />
                    ))}
                </div>
                <div
                    id='itemmagic_outerwear'
                    className={`item_details${coatHide ? ' hide' : ''}`}
                >
                    {coatItems.map(item => (
                        <Item
                            key={item.key}
                            hide={coatHide}
                            imgSrc={item.imgSrc}
                            selected={selectedItemType === item.key}
                            onClick={() => handleItemClick(item.imgSrc, item.type, item.key)}
                        />
                    ))}
                </div>
                <div className='itemmagic_body'>
                    <div>
                        <div className='image' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <video ref={videoRef} id='video' style={{ display: imgSrc ? 'none' : 'block' }} playsInline controls={false} />
                            <img
                                ref={imgRef}
                                src={imgSrc}
                                alt=""
                                style={{
                                    display: (imgSrc && !showSphere && loadingText === '') ? 'block' : 'none',
                                    maxWidth: '100%'
                                }}
                            />
                            <div id='createload'></div>
                            <canvas
                                id="scene"
                                style={{
                                    display: showSphere ? 'block' : 'none',
                                    width: '300px',
                                    height: '300px',
                                    margin: '0 auto'
                                }}
                            ></canvas>
                            <p id='loading'>{loadingText}</p>
                        </div>
                        <div className='tool'>
                            {imgSrc === '' ? (
                                <>
                                    <button id="takePhotoBtn" onClick={handleTakePhoto} style={{ borderRadius: 6 }}>
                                        <span className="icon photo_camera">photo_camera</span>拍照
                                    </button>
                                    <button id="uploadPhotoBtn" onClick={() => fileInputRef.current.click()} style={{ borderRadius: 6 }}>
                                        <span className="icon account_box">account_box</span>上傳照片
                                    </button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleUploadPhoto}
                                    />
                                </>
                            ) : (
                                <>
                                    <button id="retakeBtn" onClick={handleRetake} style={{ borderRadius: 6 }}>
                                        {mode === 'camera' ? (
                                            <>
                                                <span className="icon photo_camera">photo_camera</span>重新拍照
                                            </>
                                        ) : (
                                            <>
                                                <span className="icon account_box">account_box</span>重新上傳
                                            </>
                                        )}
                                    </button>
                                    {downloadUrl === '' ? (
                                        <button id="submitPhotoBtn" onClick={handleSubmitPhoto} style={{ borderRadius: 6 }}>
                                            <span className="icon send">send</span>送出圖片
                                        </button>
                                    ) : (
                                        <button id="downloadBtn" onClick={handleDownload} style={{ borderRadius: 6 }}>
                                            <span className="icon download">download</span>下載圖片
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <p>本功能提供參考使用，依實體為主</p>
                </div>
            </main>
            {(showSphere || loadingText) && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(255,255,255,0.5)',
                        zIndex: 99999,
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* 可加載入動畫或文字 */}
                </div>
            )}
        </>
    );
}

export default ItemMagic;