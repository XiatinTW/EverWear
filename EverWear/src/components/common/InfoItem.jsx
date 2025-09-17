import React, { useState } from 'react';
import styles from '../../style/ShoppingCart.module.css';

const InfoItem = ({ title, subtitle, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(prev => !prev);

  // 【修正】: 使用 styles['class-name'] 語法，並動態添加 'expanded' class
  const itemClasses = `${styles['info-item']} ${isExpanded ? styles.expanded : ''}`;
  
  return (
    <>
      <div className={itemClasses} onClick={toggleExpand}>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <i className="fa-solid fa-chevron-right"></i>
        
        {isExpanded && (
          <div className={styles['info-item-content']}>
            {children}
          </div>
        )}
      </div>
      <hr />
    </>
  );
};

export default InfoItem;
