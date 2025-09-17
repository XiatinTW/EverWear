import React, { useState, useRef } from 'react';

function LoadHelp({ onAgree }) {
    const [checked, setChecked] = useState(false);
    const [canCheck, setCanCheck] = useState(false);
    const termsRef = useRef(null);

    const handleScroll = () => {
        const el = termsRef.current;
        if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
            setCanCheck(true);
        }
    };

    return (
        <div className="loadhelp">
            <h3 className='text-h3'>試衣功能使用者同意條款</h3>
            <div
                className='text-p'
                style={{overflowY: 'auto', maxHeight: '300px'}}
                ref={termsRef}
                onScroll={handleScroll}
            >
                <p>親愛的使用者，歡迎使用本網站提供的「試衣功能」。<br />
                為保障您的個人隱私與權益，請您於使用本功能前，詳細閱讀並同意以下條款：</p>
                <b>1.資料提供</b>
                <ul>
                    <li>您可透過上傳照片或使用拍照功能，提供個人影像以使用本網站之試衣功能。</li>
                    <li>您保證所提供的照片或影像為您本人或已獲得當事人合法授權之資料。</li>
                </ul>
                <b>2.使用目的與範圍</b>
                <ul>
                    <li>您所提供之照片或影像僅用於本網站的「試衣功能」即時運算與顯示。</li>
                    <li>本網站 不會蒐集、保存或另行使用您的照片、肖像或試衣結果影像。</li>
                </ul>
                <b>3.資料保存與刪除</b>
                <ul>
                    <li>照片或影像僅在您使用功能的過程中於系統暫時處理，功能結束後即自動刪除，不會保存。</li>
                    <li>您無需額外提出刪除請求，系統將自動確保不留存任何影像。</li>
                </ul>
                <b>4.隱私與安全</b>
                <ul>
                    <li>本網站將採取合理的技術措施，確保您的影像僅用於即時試衣處理，不會被存檔或外流。</li>
                    <li>但因網路傳輸之特性，無法保證百分之百安全，請您自行評估後提供影像。</li>
                </ul>
                <b>5.使用者責任</b>
                <ul>
                    <li>請勿上傳涉及侵害他人隱私、智慧財產權或不當內容之照片。</li>
                    <li>如因您提供之資料涉及第三人權益爭議，相關責任由您自行承擔。</li>
                </ul>
                <b>6.免責聲明</b>
                <ul>
                    <li>本網站對於因系統異常、網路狀況或第三方因素，導致試衣功能無法正常使用，將不承擔任何賠償責任。</li>
                    <li>本網站保留隨時修改或中止本服務之權利。</li>
                </ul>
                <b>7.同意條款</b>
                <ul>
                    <li>當您上傳或拍攝照片，即表示您已閱讀、理解並同意本條款之所有內容。</li>
                </ul>
                </div>
            <div className='check'>
                <input
                    type="checkbox"
                    id="agreeCheck"
                    checked={checked}
                    disabled={!canCheck}
                    onChange={e => setChecked(e.target.checked)}
                />
                <p className='text-p'>同意試衣功能使用者同意條款</p>
                {!canCheck && (
                    <span style={{color: 'red', fontSize: '12px',margin: '10px',alignContent: 'center'}}>請閱讀完條款後才能勾選</span>
                )}
            </div>
            <button
                id='takePhotoBtn'
                disabled={!checked}
                onClick={() => checked && onAgree && onAgree()}
                 style={{ borderRadius: 6 }}
            >
                開始體驗
            </button>
        </div>
    );
}

export default LoadHelp;
