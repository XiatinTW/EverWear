import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import { useNavigate } from "react-router-dom";
import "../style/skincolor.css";

export default function SkinColor() {
  const imageUploadRef = useRef(null);
  const videoRef = useRef(null);
  const photoCanvasRef = useRef(null);
  const takePhotoBtnRef = useRef(null);
  const cameraBtnRef = useRef(null);
  const resultDivRef = useRef(null);
  const videoImageWrapperRef = useRef(null);
  const carouselRef = useRef(null);

  const [resultHtml, setResultHtml] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [showTakePhotoBtn, setShowTakePhotoBtn] = useState(false);
  const [recommendColors, setRecommendColors] = useState([]); // 新增：推薦顏色
  const [seasons, setSeasons] = useState([]); // 新增 seasons 狀態
  const [recommendProducts, setRecommendProducts] = useState([]); // 推薦商品卡片
  const [activeIndex, setActiveIndex] = useState(0); // 初始置中第一張
  const [isDragging, setIsDragging] = useState(false); // 滑鼠拖曳狀態
  const [dragStartX, setDragStartX] = useState(0); // 拖曳起始位置
  const [dragDeltaX, setDragDeltaX] = useState(0); // 拖曳距離
  const navigate = useNavigate();

  useEffect(() => {
    async function loadModels() {
      // 僅在尚未設定 backend 時才設定，避免重複註冊警告
      try {
        if (tf && tf.getBackend && tf.setBackend && tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl'); // 若遇問題可改 'cpu'
        }
      } catch (e) {
        // 忽略重複註冊警告
      }
      const MODEL_URL = "/weights";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);
      // 模型載入完成
    }
    loadModels();
    // 取得 seasons 表
    fetch('/api/seasons')
      .then(res => res.json())
      .then(data => setSeasons(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    // 若卡片數量變動，重設 activeIndex 為中間
    if (recommendProducts.length > 0) {
      setActiveIndex(Math.floor(recommendProducts.length / 2));
    }
  }, [recommendProducts.length]);

  // 檔案上傳事件
  const handleImageUpload = async (e) => {
    if (!e.target.files.length) return;
    const img = await faceapi.bufferToImage(e.target.files[0]);
    handleImage(img);
  };

  // 開啟相機
  const handleCameraBtnClick = async () => {
    // 清除前一次拍完的 image
    Array.from(document.body.querySelectorAll('img.uploaded-face')).forEach(el => el.remove());
    setShowVideo(true);
    setShowTakePhotoBtn(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      alert('無法開啟相機: ' + err.message);
    }
  };

  // 拍照
  const handleTakePhoto = () => {
    const video = videoRef.current;
    const photoCanvas = photoCanvasRef.current;
    if (video.readyState < 2) {
      alert('相機尚未準備好，請稍候再試。');
      return;
    }
    try {
      // 依 video 實際寬高設定 canvas
      const videoWidth = video.videoWidth || video.offsetWidth;
      const videoHeight = video.videoHeight || video.offsetHeight;
      photoCanvas.width = videoWidth;
      photoCanvas.height = videoHeight;
      photoCanvas.getContext('2d').drawImage(video, 0, 0, videoWidth, videoHeight);
      setShowVideo(false);
      setShowTakePhotoBtn(false);
      photoCanvas.style.display = "none";
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      const img = new window.Image();
      img.onload = () => handleImage(img);
      img.src = photoCanvas.toDataURL('image/png');
    } catch (e) {
      alert('拍照失敗，請重試。');
      console.error(e);
    }
  };

  // seasonId 對應表
  const seasonTypeMap = {
    "春季暖調": 1,
    "夏季冷調": 2,
    "秋季暖調": 3,
    "冬季冷調": 4
  };

  // 處理圖片分析
  async function handleImage(image) {
    // 清除舊圖片
    Array.from(videoImageWrapperRef.current.querySelectorAll('img.uploaded-face')).forEach(el => el.remove());
    image.className = 'uploaded-face';
    videoImageWrapperRef.current.appendChild(image);
    // 偵測臉部與特徵點
    const detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    if (!detections.length) {
      setResultHtml("偵測不到臉部，請換一張更清晰的照片。");
      return;
    }
    const landmarks = detections[0].landmarks;
    // 創建一個 Canvas 來操作圖片像素
    const canvas = document.createElement('canvas');
    // 這裡加上 willReadFrequently: true
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0, image.width, image.height);
    // 定義取樣點 (臉頰中心點)
    const leftCheek = landmarks.getJawOutline()[3];
    const rightCheek = landmarks.getJawOutline()[13];
    // 取得顏色數據
    const leftCheekColor = ctx.getImageData(leftCheek.x, leftCheek.y, 1, 1).data;
    const rightCheekColor = ctx.getImageData(rightCheek.x, rightCheek.y, 1, 1).data;
    // 平均 RGB
    const avgR = (leftCheekColor[0] + rightCheekColor[0]) / 2;
    const avgG = (leftCheekColor[1] + rightCheekColor[1]) / 2;
    const avgB = (leftCheekColor[2] + rightCheekColor[2]) / 2;
    // RGB 轉 HSL
    const hslColor = rgbToHsl(avgR, avgG, avgB);
    // 分析膚色
    const colorResult = getPersonalColor(hslColor, seasons);
    // colorResult: { season_id, name }
    let colorsHtml = "";
    if (colorResult && colorResult.season_id) {
      try {
        const res = await fetch(`/api/season_colors`);
        const allSeasonColors = await res.json();
        const filtered = allSeasonColors.filter(c => c.season_id === colorResult.season_id);
        setRecommendColors(filtered);
        // 取得推薦商品（假設有API /api/recommend_products?season_id=xxx）
        const prodRes = await fetch(`/api/recommend_products?season_id=${colorResult.season_id}`);
        const products = await prodRes.json();
        setRecommendProducts(Array.isArray(products) ? products : []);
      } catch (e) {
        setRecommendProducts([]);
      }
    }
    setResultHtml(`
      <h6 class="text-h6">分析完成！</h6>
      <h6 class="text-h6">您的個人色彩類型是：
        <h3 class="text-h3">${colorResult ? colorResult.name : ''}</h3>
      </h6>
    `);
  }

  // RGB 轉 HSL
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s, l: l };
  }

  // 四季色彩規則，回傳 seasons 表的 name
  function getPersonalColor(hsl, seasonsArr) {
    const { h, s, l } = hsl;
    let type = '';
    if ((h >= 0 && h <= 50) || (h >= 290 && h <= 360)) {
      if (s > 0.5 && l > 0.5) {
        type = '春';
      } else {
        type = '秋';
      }
    } else {
      if (s < 0.6 && l > 0.5) {
        type = '夏';
      } else {
        type = '冬';
      }
    }
    // 用 seasonsArr 找 season_id 與 name
    if (Array.isArray(seasonsArr)) {
      // 支援 name 包含 "春", "夏", "秋", "冬"
      const found = seasonsArr.find(s => s.name.includes(type));
      if (found) {
        return { season_id: found.season_id, name: found.name };
      }
    }
    return { season_id: null, name: type };
  }

  // 卡片動畫樣式
  const cardBaseStyle = {
    flex: '0 0 200px',
    height: '300px',
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'transform 0.6s ease, opacity 0.6s ease'
  };
  const cardImgStyle = {
    width: '120px',
    height: '160px',
    objectFit: 'contain',
    marginBottom: '16px'
  };
  const cardNameStyle = {
    fontSize: '1.2rem',
    fontWeight: 400,
    color: '#222',
    textAlign: 'center',
    margin: 0,
    marginBottom: '8px'
  };

  const getCarouselOffset = () => {
    // 卡片寬度+間距: 220px，視窗寬度一半-卡片寬度一半
    const cardWidth = 220;
    const offset = -activeIndex * cardWidth + window.innerWidth / 2 - cardWidth / 2;
    return offset;
  };

  const carouselStyle = {
    display: 'flex',
    gap: '20px',
    flexDirection: 'row',
    transition: 'transform 0.6s ease',
    transform: `translateX(${getCarouselOffset()}px)`
  };

  // 滑鼠事件處理
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragDeltaX(0);
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragDeltaX(e.clientX - dragStartX);
  };
  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // 根據拖曳距離切換卡片
    if (dragDeltaX > 60 && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (dragDeltaX < -60 && activeIndex < recommendProducts.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
    setDragDeltaX(0);
  };

  // 手機觸控事件
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setTouchStartX(e.touches[0].clientX);
      setTouchDeltaX(0);
    }
  };
  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // 根據拖曳距離切換卡片
    if (touchDeltaX > 60 && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (touchDeltaX < -60 && activeIndex < recommendProducts.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
    setTouchDeltaX(0);
  };

  return (
    <>
      <main style={{display: "flex", justifyContent: "center", padding: '60px'}}>
        <div className="container_body">
          <div id="result" className="pc_result" ref={resultDivRef} dangerouslySetInnerHTML={{ __html: resultHtml }}></div>
          <div id="video_image_wrapper" ref={videoImageWrapperRef}>
            <span
              style={{
                display: "flex",
                backgroundColor: "#D9D9D9",
                width: "55%",
                height: "60%",
                borderRadius: "100%",
                position: "absolute",
                zIndex: 0,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)"
              }}></span>
            <video
              id="video"
              ref={videoRef}
              autoPlay
              controls={false}
              playsInline
              style={{
                position: "absolute",
                zIndex: 1,
                width: "55%",
                height: "60%",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                display: showVideo ? "block" : "none"
              }}></video>
            <span id="video_image"></span>
          </div>
          <canvas
            id="photoCanvas"
            ref={photoCanvasRef}
            width="320"
            height="240"
            style={{display:"none"}}></canvas>
          <div className="controls_tools">
            <button
              id="takePhotoBtn"
              ref={takePhotoBtnRef}
              style={{display: showTakePhotoBtn ? "flex" : "none"}}
              onClick={handleTakePhoto}
            >
              <span className="icon photo_camera">photo_camera</span>拍照
            </button>
            <button
              id="cameraBtn"
              ref={cameraBtnRef}
              onClick={handleCameraBtnClick}
              style={{display: showTakePhotoBtn ? "none" : "flex"}}
            >
              <span className="icon photo_camera">photo_camera</span>拍照
            </button>
            <label
              htmlFor="imageUploadReal"
              className="custom-upload-label"
              style={{display: showTakePhotoBtn ? "none" : "flex"}}
            >
              <span className="icon account_box">account_box</span>上傳照片
              <input
                type="file"
                id="imageUploadReal"
                accept="image/*"
                style={{display:"none"}}
                ref={imageUploadRef}
                onChange={handleImageUpload}
              />
            </label>
            <h6 style={ { color: 'var(--color-base_text_2)' }}>（請確保在白天自然光下拍攝）</h6>
          </div>
          <div id="result" className="meb_result" ref={resultDivRef} dangerouslySetInnerHTML={{ __html: resultHtml }}></div>
          {/* 推薦商品卡片區塊（動畫參考 lab6.html） */}
          {recommendProducts.length > 0 && (
            <div
              className="carousel"
              ref={carouselRef}
              style={{
                ...carouselStyle,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                // 拖曳時微調位置 (滑鼠+觸控)
                transform: `translateX(${getCarouselOffset() + dragDeltaX + touchDeltaX}px)`
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={isDragging ? handleMouseMove : undefined}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {recommendProducts.map((prod, idx) => (
                <div
                  key={prod.name + idx}
                  className={`card${idx === activeIndex ? ' active' : ' inactive'}`}
                  style={{
                    ...cardBaseStyle,
                    ...(idx === activeIndex ? { transform: 'scale(1.2)', zIndex: 10 } : { opacity: 0.6 })
                  }}
                  onClick={() => {
                    if (activeIndex !== idx) {
                      setActiveIndex(idx);
                    } else {
                      // 第二次點擊，跳轉到商品頁並帶入 product_id（需判斷 prod.product_id 是否存在）
                      if (prod.product_id) {
                        navigate(`/home/item?product_id=${prod.product_id}`);
                      }
                    }
                  }}
                >
                  <img src={prod.images && prod.images.length > 0 ? prod.images[0] : ''} alt={prod.name} style={cardImgStyle} />
                  <div style={cardNameStyle}>{prod.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <div style={{display: "flex", gap: "1em"}}>
      </div>
    </>
  );
}
