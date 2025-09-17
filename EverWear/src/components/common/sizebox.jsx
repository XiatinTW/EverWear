import React from "react";

function SizeBox({ size, onClose }) {
    return (
        <div className="SizeBox">
            {/* 標題 */}
            <h1 className="text-h1">尺寸</h1>
            {/* 關閉按鈕 */}
            <span onClick={onClose}>×</span>
            {/* 圖片區塊 */}
            <div>
                <img src={size} alt="size-table"/>
            </div>
        </div>
    )
}

export default SizeBox;