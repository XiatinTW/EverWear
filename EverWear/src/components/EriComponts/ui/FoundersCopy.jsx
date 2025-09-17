import { useState, useRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { gsap } from "gsap";
import member1 from "../../../assets/brandStory/member1.jpg";
import member2 from "../../../assets/brandStory/member2.jpg";
import member3 from "../../../assets/brandStory/member3.jpg";
import member4 from "../../../assets/brandStory/member4.jpg";
import member5 from "../../../assets/brandStory/member5.jpg";

// 用於存儲當前滑鼠懸停的成員圖片
const imageMap = {
  member1: member1,
  member2: member2,
  member3: member3,
  member4: member4,
  member5: member5,
};

// 亂碼動畫函式
// 它接收三個參數：element (要操作的 DOM 元素)、text (正確的文字) 和 duration (動畫總時長)。
const scrambleText = (element, text, duration) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let scrambledText = "";

  // 函式內部使用 gsap.timeline() 逐步建立一個動畫時間軸。
  const timeline = gsap.timeline({
    paused: true,
  });

  // 它透過迴圈，在每個小時間單位內，將文字逐步從亂碼替換為正確的文字，直到整個字串都顯示正確。這創造了「從亂碼變成文字」的視覺效果。
  for (let i = 0; i < text.length; i++) {
    timeline.to(
      element,
      {
        duration: duration / text.length,
        onUpdate: () => {
          scrambledText = text.substring(0, i + 1);
          for (let j = i + 1; j < text.length; j++) {
            scrambledText += chars.charAt(
              Math.floor(Math.random() * chars.length)
            );
          }
          element.textContent = scrambledText;
        },
      },
      `+=${(duration / text.length) * 0.2}`
    ); // 稍微延遲每個字元
  }

  timeline.play();
};

export default function Founders() {
  // 判斷是否為大螢幕
  const isDesktop = useMediaQuery({ minWidth: 768 });
  const imageRef = useRef(null); // for mobile
  const desktopImageRef = useRef(null); // for desktop
  // 追蹤大螢幕，當前被懸停的那個成員物件。
  const [hoveredImage, setHoveredImage] = useState(null);
  // 追蹤小螢幕，當前被點擊的那個成員物件。
  const [activeRole, setActiveRole] = useState(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  // 追蹤滑鼠座標
  const refs = useRef([]);
  // 用於儲存所有職位元素的 ref

  const roles = [
    {
      id: "member1",
      title: "商品總監",
      engTitle: "Merchandising Director",
      name: "Patricia Chen",
      image: imageMap.member1,
    },
    {
      id: "member2",
      title: "品牌總監",
      engTitle: "Brand Director",
      name: "Chelsea Lin",
      image: imageMap.member2,
    },
    {
      id: "member3",
      title: "設計總監",
      engTitle: "Design Director",
      name: "Kevin Chow",
      image: imageMap.member3,
    },
    {
      id: "member4",
      title: "創意總監",
      engTitle: "Creative Director",
      name: "Jennie Nichols",
      image: imageMap.member4,
    },
    {
      id: "member5",
      title: "視覺總監",
      engTitle: "Art Director",
      name: "Vik Pham",
      image: imageMap.member5,
    },
  ];

  // 統一處理文字亂碼動畫
  const handleScramble = (role, index) => {
    const titleElement = refs.current[index]?.querySelector("h3");
    const nameElement = refs.current[index]?.querySelector("p");

    if (titleElement) scrambleText(titleElement, role.title, 0.7);
    if (nameElement) scrambleText(nameElement, role.name, 0.7);
  };

  // 這是小螢幕模式的核心控制函式。
  const handleMobileClick = (role, index) => {
    handleScramble(role, index);
    setActiveRole(role);
    setHoveredImage(role.image);
    // 不要在這裡執行 gsap 動畫
  };

  const handleDesktopHover = (role, index) => {
    setHoveredImage(role.image);
    handleScramble(role, index);
  };

  const handleDesktopLeave = () => {
    setHoveredImage(null);
  };

  const handleMouseMove = (e) => {
    setCoords({ x: e.clientX, y: e.clientY });
  };

  // 大螢幕 hover 圖片：監聽 hoveredImage 的變化
  useEffect(() => {
    if (isDesktop && hoveredImage && desktopImageRef.current) {
      gsap.to(desktopImageRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power4.out",
      });
    } else if (isDesktop && desktopImageRef.current) {
      gsap.to(desktopImageRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power4.out",
      });
    }
  }, [hoveredImage, isDesktop]); // 監聽 hoveredImage 的變化

  // 小螢幕下圖片動畫完全交給 useEffect 控制
  useEffect(() => {
    if (!isDesktop && hoveredImage && imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, y: -100 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
      const timeout = setTimeout(() => {
        if (imageRef.current) {
          gsap.to(imageRef.current, {
            opacity: 0,
            duration: 1,
            delay: 0.5,
            onComplete: () => setHoveredImage(null),
          });
        }
        setActiveRole(null);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [hoveredImage, isDesktop]);

  return (
    <div className="flex relative justify-center items-start w-full h-full text-secondary p-[2rem]">
      {/* 左側文字清單 */}
      <div className="flex flex-col w-full justify-between sm:gap-[2rem]">
        {roles.map((role, index) => (
          <div
            key={index}
            // 把當前 div 的 ref 存入 refs.current
            ref={(el) => (refs.current[index] = el)}
            className={`cursor-pointer group hover:text-primary ${
              !isDesktop && activeRole?.id === role.id
                ? "flex-row items-center justify-between"
                : "flex-col"
            }`}
            // 大螢幕：使用 onMouseEnter 和 onMouseLeave 來觸發 setHoveredImage，實現滑鼠懸停換圖。
            onMouseEnter={
              isDesktop ? () => handleDesktopHover(role, index) : null
            }
            onMouseLeave={
              isDesktop ? () => handleDesktopLeave(role, index) : null
            }
            onMouseMove={isDesktop ? handleMouseMove : null} // 監聽滑鼠移動
            // 小螢幕：使用 onClick 觸發 handleMobileClick 函式，這是所有複雜邏輯的入口。
            onClick={!isDesktop ? () => handleMobileClick(role, index) : null}
          >
            <div className="flex">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">{role.title}</h3>
                <h3 className="text-lg font-semibold">{role.engTitle}</h3>
                <p className="text-sm">{role.name}</p>
              </div>
              {/* 小螢幕下，圖片出現在這個 div 裡 */}
              {!isDesktop && activeRole?.id === role.id && (
                <div className="flex w-[30%] ml-auto justify-center items-center m-[1rem]">
                  <img
                    ref={imageRef}
                    src={hoveredImage}
                    alt="member"
                    className="object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            <div className="h-px bg-gray-600 mt-2"></div>
          </div>
        ))}
      </div>

      {/* 右側圖片區域 (僅大螢幕顯示) */}
      {isDesktop && hoveredImage && (
        <div className="absolute pointer-events-none z-50">
          <img
            ref={desktopImageRef}
            src={hoveredImage}
            alt="member"
            style={{
              left: `${coords.x + 200}px`,
              top: `${coords.y - 100}px`,
              position: "fixed",
              opacity: 0,
              transition: "opacity 0.3s",
              width: "14rem",
              height: "17rem",
              objectFit: "cover",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
              pointerEvents: "none",
              zIndex: 100,
            }}
          />
        </div>
      )}
    </div>
  );
}
