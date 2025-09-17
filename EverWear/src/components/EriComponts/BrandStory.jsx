import Header from "../EriComponts/ui/header.jsx";
import Waves from "../EriComponts/ui/Waves.jsx";
import History from "../EriComponts/ui/History.jsx";
import ThemeIntro_h from "../EriComponts/ui/ThemeIntro_h.jsx";
import ThemeIntro_f from "../EriComponts/ui/ThemeIntro_f.jsx";
// import Founders from "../components/ui/Founders.jsx";
import Future from "../EriComponts/ui/Future.jsx";
import styles from "../../style/BrandStory.module.css";
import { useEffect, useRef } from "react";
import FoundersCopy from "../EriComponts/ui/FoundersCopy.jsx";

// import Header from "../components/layout/Header_2.jsx";

export default function BrandStory() {
  const historyData = [
    {
      id: 1,
      year: 1990,
      image: "line",
      story: (
        <>
          1990s–2010s｜
          <br /> 被世界認可，卻從未留下自己名字
          <br />
          這間工廠曾為歐洲、日本、美國的品牌製作滑雪外套、防水風衣與極地羽絨服，但每一件衣服出廠時，標籤上都印著別人的名字
          <br />
          <br />
          這段歷史成為 EverWear 的根：我們從不是初創，而是重新定義自己的角色
        </>
      ),
    },
    {
      id: 2,
      year: 2019,
      image: "factory",
      story: (
        <>
          2019｜
          <br /> 一場提案，改寫工廠的未來
          <br />
          幾位學生在課堂外組成創業小組，深入研究紡織產業的困境與可能。他們主動拜訪工廠、訪談縫紉師、收集布料樣本，最終提出「讓機能服飾進入生活風格」的品牌構想。
          <br />
          <br />
          這場對話，不只讓年輕人走入工藝，也讓老一輩看見未來。
        </>
      ),
    },
    {
      id: 3,
      year: 2020,
      image: "branding",
      story: (
        <>
          2020｜
          <br /> 疫情來襲，EverWhere 正式成立
          <br />
          在全球封鎖與物流停滯的背景下，EverWhere 於 2020
          年悄然成立。首發產品是一件能從山林穿到城市的輕量風衣，專為亞洲潮濕多變氣候設計。
          <br />
          <br />
          這不只是實驗，更是一次對「我們可以穿出自己的品牌」的回答。
        </>
      ),
    },
    {
      id: 4,
      year: 2021,
      image: "artist",
      story: (
        <>
          2021｜
          <br /> 地方共創 × 全球共感
          <br />
          EverWhere
          走入台灣各地，與原住民女性縫紉師、青年藝術家、布料供應商共創系列，推出《地形線》、《雨的語言》等限定商品，將地方經驗轉譯為機能美學。
          <br />
          <br />
          同時，也拓展海外銷售據點，從台灣走向東京、首爾與香港。
        </>
      ),
    },
    {
      id: 5,
      year: 2023,
      image: "transition",
      story: (
        <>
          2023｜
          <br /> 品牌使命：讓每一位在路上的人，都能帶著一點溫度與風格
          <br />
          EverWhere
          是為移動中的人而設計的品牌。不論是下班後趕末班車的城市人、週末登山的自由者，還是正在尋找自己方向的青年，我們希望透過衣服，給你一種陪伴感。
          <br />
          <br />
          我們的產品分為四大系列：
          <br /> • Urban Light 城市輕機能
          <br /> • Nomad Shell 戶外耐候防護
          <br /> • Foldable Warm 輕量收納保暖
          <br /> • Craft Series 聯名與文化實驗計畫
        </>
      ),
    },
  ];
  const scrollerRef = useRef(null); // 為滾動容器建立一個 ref

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <>
      {/* Header 獨立在外層，不參與捲動 */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* 單一可滾動容器：固定鋪滿視窗、內部才可滾動 → 不會有雙滑軌 */}
      <div className="noise-effect fixed inset-0 z-0 w-full overflow-hidden">
        <div
          ref={scrollerRef} // 將 ref 賦予給滾動容器
          className={[
            "h-full w-full overflow-y-auto scroll-smooth",
            "snap-y snap-mandatory",
            styles.snapScroll, // 隱藏捲軸（跨瀏覽器）
          ].join(" ")}
        >
          {/* Section 1 */}
          <section
            className="one snap-start w-full flex flex-col gap-[70px] justify-center bg-accent"
            style={{
              backgroundImage: `
              url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='5' numOctaves='10'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23noise)' fill='white'/></svg>")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundBlendMode: "multiply",
              filter: "brightness(1)",
            }}
          >
            <div className="flex flex-col items-center justify-center pt-[2rem] text-secondary">
              <div className={`${styles.marquee}`}>
                <div className={`gap-[1rem] ${styles.marqueeContent}`}>
                  <img
                    src="/src/assets/EVERWEAR-runnig.png"
                    alt="Running Effect"
                    className={styles.marqueeImage}
                  />
                  <img
                    src="/src/assets/EVERWEAR-runnig.png"
                    alt="Running Effect"
                    className={styles.marqueeImage}
                  />
                </div>
              </div>
            </div>
            {/* waves */}
            <div className="w-full h-auto relative overflow-hidden pl-[6rem] -mt-[3rem]">
              <Waves />
            </div>
            <div
              className="flex flex-col text-primary text-center -mt-[1rem] mb-[4rem] sm:mb-[2rem] animate-bounce cursor-pointer"
              onClick={() => {
                scrollerRef.current.scrollBy({
                  top: window.innerHeight,
                  behavior: "smooth",
                });
              }}
            >
              <span className="text-h6 font-medium hover:font-bold hover:underline">
                Scroll
              </span>
              <span className="text-h6 ml-[0.5rem] font-medium rotate-90">
                &gt;
              </span>
            </div>
          </section>

          <section
            className="two h-screen snap-start w-full flex justify-center items-center bg-primary relative"
            style={{
              backgroundImage: `
              url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='5' numOctaves='10'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23noise)' fill='white'/></svg>")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundBlendMode: "multiply",
              filter: "brightness(1)",
            }}
          >
            <ThemeIntro_h scrollerRef={scrollerRef} />
          </section>

          {/* Section 3：歷史區塊（你的 History 版面與資料不變） */}
          {historyData.map((item) => (
            <section
              key={item.id}
              className="three h-screen snap-start w-full flex items-center justify-center bg-black relative"
            >
              <History historyData={[item]} />
            </section>
          ))}

          <section
            className="four h-screen snap-start w-full flex items-center justify-center bg-primary elative"
            style={{
              backgroundImage: `
              url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='5' numOctaves='10'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23noise)' fill='white'/></svg>")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundBlendMode: "multiply",
              filter: "brightness(1)",
            }}
          >
            <ThemeIntro_f scrollerRef={scrollerRef} />
          </section>
          <section
            className="four h-screen snap-start w-full flex items-center justify-center bg-accent relative"
            style={{
              backgroundImage: `
              url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='5' numOctaves='10'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23noise)' fill='white'/></svg>")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundBlendMode: "multiply",
              filter: "brightness(1)",
            }}
          >
            <div className="text-h4 text-secondary text-center px-5" style={{ color: "#EAE6D9" }}>
              『 EverWear 並非一個人的夢想，而是「我們一起做」的未來
              <br />
              <br />
              從代工廠起步，我們與土地、工藝與青年共同縫製一個全新的答案 』
            </div>
          </section>

          <section className="five h-screen snap-start w-full flex items-center justify-center pt-[2em] md:pt-[8rem] bg-black">
            {/* <Founders /> */}
            <FoundersCopy />
          </section>
          <section
            className="six h-screen snap-start w-full flex items-center justify-center pt-[5rem] bg-primary"
            style={{
              backgroundImage: `
              url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='5' numOctaves='10'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23noise)' fill='white'/></svg>")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundBlendMode: "multiply",
              filter: "brightness(1)",
            }}
          >
            <Future
              scrollToTop={() =>
                scrollerRef.current.scrollTo({ top: 0, behavior: "smooth" })
              }
            />
          </section>
        </div>
      </div>
    </>
  );
}
