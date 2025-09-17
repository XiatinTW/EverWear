import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Future({ scrollToTop }) {
  const titleRef = useRef(null);
  const scrambleRef = useRef(null);
  // 亂碼動畫函式
  const scrambleText = (element, text, duration) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let scrambledText = "";

    const timeline = gsap.timeline({ paused: true });

    for (let i = 0; i < text.length; i++) {
      timeline.to(
        {},
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
        `+=${(duration / text.length) * 0.5}`
      );
    }

    timeline.play();
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 2030 永續目標 - 淡入浮現
            gsap.fromTo(
              titleRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 2, ease: "power3.out" }
            );

            // 亂碼動畫 - 目標文字
            scrambleText(
              scrambleRef.current,
              "『 達成 80% 使用低碳材料，全系列棄用動物羽絨與皮草 』",
              1
            );

            observer.disconnect(); // 避免重複觸發
          }
        });
      },
      { threshold: 0.2 } // 元件進入 20% viewport 時觸發
    );

    if (titleRef.current) observer.observe(titleRef.current);
  }, []);

  return (
    <>
      <div className="flex flex-col relative justify-between items-center w-full h-full pb-[2rem]">
        <div className="px-5">
          <img src="/src/assets/brandStory/futureVision.svg" alt="" />
        </div>

        {/* 浮現 */}
        <p
          ref={titleRef}
          className="text-h3 text-secondary opacity-0" // 預設隱藏
          style={ { color: 'rgb(234 230 217)'}}
        >
          2030 永續目標
        </p>

        {/* 亂碼動畫文字 */}
        <div className="px-[2rem]">
          <p ref={scrambleRef} className="text-nowrap text-h6 text-secondary" style={ { color: 'rgb(234 230 217)'}}>
            {/* 預設先放空，動畫再填入 */}
          </p>
        </div>

        <div className="global-animation w-full">
          <img
            className="object-cover"
            src="/src/assets/brandStory/global.svg"
            alt=""
          />
        </div>
        <div
          className="flex text-secondary w-[3rem] h-[3rem] p-[2rem] mb-[2.5rem] sm:mb-0 sm:mt-[2rem] border-2 border-secondary rounded-full justify-center items-center shadow-lg cursor-pointer hover:bg-secondary hover:text-primary hover:opacity-70 hover:font-extrabold"
          onClick={scrollToTop}
        >
          TOP
        </div>
      </div>
    </>
  );
}
