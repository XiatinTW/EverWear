import React from 'react';

function Item({ hide, imgSrc, selected, onClick }) {
    return (
        <div
            className={`item${hide ? ' hide' : ''}${selected ? ' selected' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            <div className="item-taskalt">
                {/* 選擇時 task_alt 加 hide，未選擇時顯示 */}
                <span className={`icon task_alt${selected ? ' hide' : ''}`}></span>
            </div>
            <img src={imgSrc} alt="" />
        </div>
    );
}

export default Item;
