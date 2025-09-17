import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export default function ThemeIntro_h({ scrollerRef }) {
  // 接收滾動容器的ref
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    // 確保滾動容器已掛載
    if (!scrollerRef.current) return;
    // 設定 GSAP 的 ScrollTrigger 預設滾動容器
    ScrollTrigger.defaults({
      scroller: scrollerRef.current, // 讓 ScrollTrigger 監聽你傳進來的滾動容器
    });

    const section = sectionRef.current;
    const text = textRef.current;
    const line = lineRef.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top center",
        end: "bottom center",
        toggleActions: "play none none reverse",
        // 這裡不需要額外設定scroller，因為defaults已經設定好了
      },
    });

    tl.fromTo(
      text,
      { opacity: 0, scale: 0 },
      { opacity: 0.6, scale: 1, duration: 1, ease: "power2.inOut" }
    );

    // Animate the line
    tl.fromTo(
      line,
      { scaleY: 0, transformOrigin: "top" },
      { scaleY: 1, duration: 1, ease: "power2.inOut" },
      "<"
    );
  }, [scrollerRef]); // 依賴於 scrollerRef 的改變

  return (
    <>
      <div
        ref={sectionRef}
        className="relative z-10 w-full h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Our History watermark text */}
        <h1
          ref={textRef}
          className="absolute md:left-[10%] xl:left-[25%] inset-0 flex items-center justify-center text-secondary text-h1 md:justify-start opacity-0 pointer-events-none"
        >
          Our History
        </h1>

        {/* The scrolling line on the right */}
        <div className="absolute hidden right-[20rem] top-0 h-full md:flex justify-end">
          <div
            ref={lineRef}
            className="w-[2px] bg-secondary transform scale-y-0"
          ></div>
        </div> 
      </div>
    </>
  );
}
