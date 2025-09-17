import React, { useEffect, useRef, useState } from "react";
import "../../../style/WaveLines.module.css";

// Waves 元件：Canvas 上繪製水平波浪線，可隨滑鼠互動
export default function Waves() {
  const canvasRef = useRef(null); // Canvas DOM
  const containerRef = useRef(null); // Canvas 容器 DOM
  const [mouse, setMouse] = useState({ x: -1000, y: -1000 }); // 滑鼠座標

  // 可調整滑鼠影響範圍與波浪強度
  const influenceRadius = 85; // 滑鼠影響範圍，單位 px
  const waveStrength = 4; // 波浪幅度控制，數字越小波浪越小

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d"); // 2D 繪圖上下文
    const container = containerRef.current;
    let width, height; // Canvas 寬高
    const lines = []; // 存每條線的 y 座標
    const spacing = 16; // 線條間距

    // 調整 Canvas 尺寸並初始化線條
    function resize() {
      width = container.clientWidth; // Canvas 寬度 = 容器寬度
      height = container.clientHeight; // Canvas 高度 = 容器高度
      canvas.width = width;
      canvas.height = height;

      // 初始化線條陣列
      lines.length = 0;
      for (let y = spacing; y < height; y += spacing) {
        lines.push({ y });
      }
    }

    // 畫出動畫
    function draw() {
      ctx.clearRect(0, 0, width, height); // 清空畫布
      ctx.strokeStyle = "#EAE6D9"; // 線條顏色
      ctx.lineWidth = 2; // 線條寬度

      lines.forEach((line) => {
        ctx.beginPath(); // 開始新路徑
        for (let x = 0; x < width; x += 10) {
          // 計算該點與滑鼠距離
          const dx = x - mouse.x;
          const dy = line.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let offset = 0;

          // 滑鼠影響範圍判斷
          if (dist < influenceRadius) {
            // 越靠近滑鼠偏移越大
            offset =
              Math.sin((x + performance.now() / 100) / 20) *
              ((influenceRadius - dist) / waveStrength);
          }

          // 畫線到該點
          ctx.lineTo(x, line.y + offset);
        }
        ctx.stroke(); // 繪製該條線
      });

      requestAnimationFrame(draw); // 循環呼叫，形成動畫
    }

    // 滑鼠移動事件
    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect(); // Canvas 在畫面位置
      // 限制滑鼠座標在 Canvas 內
      setMouse({
        x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
        y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
      });
    }

    // 監聽視窗 resize
    window.addEventListener("resize", resize);

    // 監聽滑鼠移動
    container.addEventListener("mousemove", handleMouseMove);

    // 初始化
    resize();
    draw();

    // 清理事件
    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouse, influenceRadius, waveStrength]); // 依賴滑鼠與參數

  // JSX：Canvas 容器
  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Canvas 填滿父容器 */}
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", position: "relative",}}
      />
    </div>
  );
}
