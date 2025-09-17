import ShowcaseCard from "../../common/ShowcaseCard";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import styles from "../../../style/Showcase.module.css";
import image1 from "../../../assets/showcase_images/image_top_1.png";
import image2 from "../../../assets/showcase_images/image_top_2.png";
import image3 from "../../../assets/showcase_images/image_top_3.png";
import image4 from "../../../assets/showcase_images/image_top_4.png";
import image5 from "../../../assets/showcase_images/image_bottom_1.png";
import image6 from "../../../assets/showcase_images/image_bottom_2.png";
import image7 from "../../../assets/showcase_images/image_bottom_3.png";
import image8 from "../../../assets/showcase_images/image_bottom_4.png";
import naturalElement from "../../../assets/showcase_decorations/NaturalElement.png";
import union from "../../../assets/showcase_decorations/Union.png";
import lowkeyGlory from "../../../assets/showcase_decorations/LowkeyGlory.png";
import icons from "../../../assets/showcase_decorations/Icons.png";
import anElegant from "../../../assets/showcase_decorations/AnElegant.png";
import circle from "../../../assets/showcase_decorations/circle.png";

// 圖片對應表

// const imageMap = {
//   image1: { src: image1 },
//   image2: { src: image2 },
//   image3: { src: image3 },
//   image4: { src: image4 },
//   image5: { src: image5 },
//   image6: { src: image6 },
//   image7: { src: image7 },
//   image8: { src: image8 },
// };

export default function Showcase() {
  const sectionRef = useRef(null);
  const naturalRef = useRef(null);
  const arrowRef1 = useRef(null);
  const arrowRef2 = useRef(null);
  const lowkeyRef = useRef(null);
  const iconRef = useRef(null);
  const elegantRef = useRef(null);
  const circleRef = useRef(null); // 新增 circle 的 ref

  useEffect(() => {
    const animateRefs = [
      naturalRef,
      arrowRef1,
      arrowRef2,
      lowkeyRef,
      iconRef,
      elegantRef,
      circleRef,
    ];
    const handleEnter = ([entry]) => {
      if (entry.isIntersecting) {
        animateRefs.forEach((ref) => {
          gsap.to(ref.current, {
            y: 0, // 回歸正常位置
            opacity: 1,
            duration: 1,
            delay: 0.2,
            ease: "back.out",
          });
        });
      }
      //   當區塊離開畫面時，直接把所有元素：往下移動 y: 50 設定透明度 0
      // （也就是說每次捲動回來，又會重新觸發進場動畫）
      else {
        animateRefs.forEach((ref) => {
          gsap.set(ref.current, { y: -50, opacity: 0 });
        });
      }
    };

    const observer = new window.IntersectionObserver(handleEnter, {
      threshold: 0.5, //threshold: 0.3 → 區塊有 30% 出現在螢幕就算「進入畫面」。
    });
    if (sectionRef.current) observer.observe(sectionRef.current);

    // 初始設置為隱藏
    animateRefs.forEach((ref) => {
      gsap.set(ref.current, { y: -50, opacity: 0 });
    });

    // return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 外層容器，設定相對定位與溢出隱藏 */}
      <div
        ref={sectionRef}
        className="relative w-full text-center overflow-hidden"
      >
        {/* 所有絕對定位元素直接放在這層 */}
        <div
          id="natural"
          ref={naturalRef}
          className={`absolute z-50 origin-top-left -left-[3rem] -top-[2.5rem] rotate-[3.29deg] lg:left-[2rem] xl:left-[5rem] ${styles.parallaxLeft}`}
        >
          <img
            className="scale-[30%] object-contain"
            src={naturalElement}
            alt=""
          />
        </div>
        <div
          id="arrow1"
          ref={arrowRef1}
          className={`absolute z-50 origin-top-left left-[8rem] -top-[1rem] lg:left-[12rem] xl:left-[15rem] ${styles.parallaxLeft}`}
        >
          <img
            className="scale-[30%] object-contain"
            src={union}
            alt=""
          />
        </div>
        <div
          id="lowkeyGlory"
          ref={lowkeyRef}
          className={`absolute z-50 origin-top-left -bottom-[2rem] left-[5rem] xl:left-[32rem] ${styles.parallaxLeft}`}
        >
          <img
            className="scale-[30%] object-contain"
            src={lowkeyGlory}
            alt=""
          />
        </div>
        <div
          id="arrow2"
          ref={arrowRef2}
          className={`absolute z-50 origin-top-left rotate-[-150deg] -bottom-[14rem] left-[23rem] xl:left-[50rem] ${styles.parallaxLeft}`}
        >
          <img
            className="scale-[30%] object-contain"
            src={union}
            alt=""
          />
        </div>
        <div
          id="icon"
          ref={iconRef}
          className={`absolute z-50 origin-top-left bottom-[0.5rem] -left-[3rem] lg:left-[2rem] xl:left-[5rem] ${styles.parallaxLeft}`}
        >
          <img
            className="scale-[30%] object-contain"
            src={icons}
            alt=""
          />
        </div>
        <div
          id="elegant"
          ref={elegantRef}
          className={`hidden absolute z-50 origin-top-left lg:block lg:left-[62rem] lg:top-[2.5rem] xl:block xl:left-[68rem] xl:top-[8rem] ${styles.parallaxLeft}`}
        >
          <img
            className="scale-[35%] object-contain"
            src={anElegant}
            alt=""
          />
        </div>
        <div
          id="circle"
          ref={circleRef}
          className={`absolute z-50 origin-top-left top-[16rem] -left-[5rem] lg:left-[15rem] xl:left-[21rem] ${styles.parallaxLeft}`}
        >
          <img
            className="scale-[30%] object-contain"
            src={circle}
            alt="circle"
          />
        </div>
        {/* grid 內容 */}
        <div
          id="showcase"
          className="grid grid-cols-2 grid-rows-4 gap-[3rem] p-12 md:grid-cols-4 md:grid-rows-2 md:max-w-[1024px] mx-auto"
        >
          <ShowcaseCard photo={ image1 } />
          <ShowcaseCard photo={ image2 } />
          <ShowcaseCard photo={ image3 } />
          <ShowcaseCard photo={ image4 } />
          <ShowcaseCard photo={ image5 } />
          <ShowcaseCard photo={ image6 } />
          <ShowcaseCard photo={ image7 } />
          <ShowcaseCard photo={ image8 } />
        </div>
      </div>
    </>
  );
}
