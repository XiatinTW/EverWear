import { useState, useRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { gsap } from "gsap";
import member1 from "../../assets/brandStory/member1.jpg";
import member2 from "../../assets/brandStory/member2.jpg";
import member3 from "../../assets/brandStory/member3.jpg";
import member4 from "../../assets/brandStory/member4.jpg";
import member5 from "../../assets/brandStory/member5.jpg";

// 用於存儲當前滑鼠懸停的成員圖片
const imageMap = {
  member1: member1,
  member2: member2,
  member3: member3,
  member4: member4,
  member5: member5,
};

export default function Founders() {
  // 判斷是否為大螢幕
  const isDesktop = useMediaQuery({ minWidth: 768 });
  const imageRef = useRef(null);
  const roles = [
    {
      id: "member1",
      title: "商品總監 (Merchandising Director)",
      name: "Patricia Chen",
      image: imageMap.member1,
    },
    {
      id: "member2",
      title: "品牌總監 (Brand Director)",
      name: "Chelsea Lin",
      image: imageMap.member2,
    },
    {
      id: "member3",
      title: "設計總監 (Design Director)",
      name: "Kevin Chow",
      image: imageMap.member3,
    },
    {
      id: "member4",
      title: "創意總監 (Creative Director)",
      name: "Jennie Nichols",
      image: imageMap.member4,
    },
    {
      id: "member5",
      title: "視覺總監 (Art Director)",
      name: "Vik Pham",
      image: imageMap.member5,
    },
  ];

  const [hoveredImage, setHoveredImage] = useState(null);

  // 使用 useEffect 監聽圖片變動，來觸發淡入淡出動畫
  useEffect(() => {
    if (hoveredImage) {
      // 如果有圖片，淡入
      gsap.to(imageRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power4.out",
      });
    } else {
      // 如果沒有圖片，淡出
      gsap.to(imageRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power4.out",
      });
    }
  }, [hoveredImage]); // 監聽 hoveredImage 的變化

  
  return (
    <div className="flex relative justify-center items-start w-full h-full text-secondary p-10 overflow-hidden">
      {/* 左側文字清單 */}
      <div className="flex flex-col w-full justify-center space-y-10">
        {roles.map((role, index) => (
          <div
            key={index}
            className="flex flex-col justify-center cursor-pointer group hover:text-primary"
            // 大螢幕時使用 onMouseEnter / onMouseLeave
            onMouseEnter={isDesktop ? () => setHoveredImage(role.image) : null}
            onMouseLeave={isDesktop ? () => setHoveredImage(null) : null}
            // 小螢幕時使用 onClick
            onClick={!isDesktop ? () => setHoveredImage(role.image) : null}
          >
            <h3 className="text-lg font-semibold">{role.title}</h3>
            <p className="text-sm">{role.name}</p>
            <div className="h-px bg-gray-600 mt-2"></div>
            {/* 小螢幕下，圖片出現在這個 div 裡 */}
            {!isDesktop && hoveredImage === role.image && (
              <div className="flex w-[100px] ml-auto justify-center items-center m-[1rem]">
                <img
                  ref={imageRef}
                  src={hoveredImage}
                  alt="member"
                  className="object-cover rounded-lg shadow-lg opacity-0"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 右側圖片區域 (僅大螢幕顯示) */}
      {isDesktop && (
        <div className="flex absolute justify-end items-center z-10">
          <img
            ref={imageRef}
            src={hoveredImage || imageMap.member1}
            alt="member"
            className="w-64 h-80 object-cover rounded-lg shadow-lg transition-opacity duration-500 opacity-0"
          />
        </div>
      )}
    </div>
  );
}
