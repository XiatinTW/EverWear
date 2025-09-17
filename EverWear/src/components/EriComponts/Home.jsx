import { Link } from "react-router-dom";
import { useState } from "react";
// import { useMediaQuery } from "react-responsive";
import Header from "./layout/Header.jsx";
import Showcase from "./ui/Showcase.jsx";
import Seasonwheel from "./ui/Seasonwheel.jsx";
import Seasoncase from "./ui/Seasoncase.jsx";
import Footer from "./layout/Footer.jsx";

import video from "../../assets/Video.mp4";

export default function Home() {
  const [visibleId, setVisibleId] = useState(null);

  const seasonBgs = {
    spring: 'url("/src/assets/seasonBackground/springbg.jpg")',
    summer: 'url("/src/assets/seasonBackground/summerbg.jpg")',
    autumn: 'url("/src/assets/seasonBackground/autumnbg.jpg")',
    winter: 'url("/src/assets/seasonBackground/winterbg.jpg")',
  };

  const seasonData = {
    1: {
      title: "春季色調",
      subtitle: "Spring tone",
      colors: ["bg-pink-500", "bg-green-200", "bg-sky-300", "bg-orange-500"],
    },
    2: {
      title: "春季色調",
      subtitle: "Spring tone",
      colors: ["bg-pink-500", "bg-green-200", "bg-sky-300", "bg-orange-500"],
    },
    3: {
      title: "夏季色調",
      subtitle: "Summer tone",
      colors: ["bg-indigo-900", "bg-green-200", "bg-rose-200", "bg-pink-300"],
    },
    4: {
      title: "夏季色調",
      subtitle: "Summer tone",
      colors: ["bg-indigo-900", "bg-green-200", "bg-rose-200", "bg-pink-300"],
    },
    5: {
      title: "秋季色調",
      subtitle: "Autumn tone",
      colors: [
        "bg-purple-800",
        "bg-amber-700",
        "bg-yellow-700",
        "bg-stone-700",
      ],
    },
    6: {
      title: "秋季色調",
      subtitle: "Autumn tone",
      colors: [
        "bg-purple-800",
        "bg-amber-700",
        "bg-yellow-700",
        "bg-stone-700",
      ],
    },
    7: {
      title: "冬季色調",
      subtitle: "Winter tone",
      colors: ["bg-teal-900", "bg-indigo-900", "bg-violet-400", "bg-black"],
    },
    8: {
      title: "冬季色調",
      subtitle: "Winter tone",
      colors: ["bg-teal-900", "bg-indigo-900", "bg-violet-400", "bg-black"],
    },
  };

  const getSeasonBg = (id) => {
    if (id === "1" || id === "2") return seasonBgs.spring;
    if (id === "3" || id === "4") return seasonBgs.summer;
    if (id === "5" || id === "6") return seasonBgs.autumn;
    if (id === "7" || id === "8") return seasonBgs.winter;
    return seasonBgs.winter; // Default background
  };

  const handleVisibleChange = (id) => {
    console.log(`Currently visible ID: ${id}`);
    setVisibleId(id);
  };

  return (
    <>
      <main className="flex flex-col items-center justify-center overflow-hidden pt-[40px]">
        <div className="w-full h-full shadow-lg border-2 border-red-50">
          <video
            className="scale-[1.3] object-cover w-full h-full"
            src= {video} // 更新為 .mp4 格式
            autoPlay
            loop
            muted
            playsInline
          >
            您的瀏覽器不支援影片播放。
          </video>
        </div>
      </main>
      <div className="flex flex-col">
        <div
          className="link-container flex w-full h-[120px] items-center justify-center shadow-xl focus:shadow-inner cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='6' numOctaves='5'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23noise)' fill='white'/></svg>")`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundBlendMode: "multiply",
            filter: "brightness(1.5)",
          }}
        >
          <Link to="/home/itempage" className="text-h5 text-accent hover:text-accent hover:opacity-75 transition-opacity duration-200">
            2026 秋冬系列
          </Link>
        </div>

        <section className="w-full h-full flex justify-center px-3 py-5 mx-auto bg-secondary shadow-lg">
          <Showcase />
        </section>

        <div
          className="link-container flex w-full h-[120px] items-center justify-center shadow-xl focus:shadow-inner cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='6' numOctaves='5'/><feColorMatrix type='matrix' values='0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23noise)' fill='white'/></svg>")`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundBlendMode: "multiply",
            filter: "brightness(1.5)",
          }}
        >
          <Link to="/home/skincolor" className="text-h5 font-medium text-accent hover:text-accent hover:opacity-75 transition-opacity duration-200">
            前往個人色彩診斷
          </Link>
        </div>

        <section
          className="season w-full h-full flex flex-col lg:flex-row justify-center items-center sm:min-h-[500px] sm:p-[3rem] sm:pb-[1rem] md:min-h-0 overflow-hidden shadow-lg"
          style={{
            backgroundImage: getSeasonBg(visibleId),
            backgroundSize: "fill",
            backgroundPosition: "center",
          }}
        >
          <div className="flex flex-col w-full h-full justify-center items-center lg:flex-row">
            <div className="roulette w-full h-full items-center justify-center -mb-[20%] sm:-mt-[35%] sm:mb-[35%] md:mb-[25%] scale-100 -rotate-12 lg:mr-[2rem] lg:mb-[35%] xl:mb-[35%]">
              <Seasonwheel onVisibleChange={handleVisibleChange} />
            </div>

            <div className="flex-1 flex-col h-auto items-center mb-[3rem] sm:ml-[8%] lg:mt-[15rem] ">
              <h1 className="text-[90px] font-bold text-white opacity-80 lg:mr-[2rem] lg:mb-[1rem]">
                {seasonData[visibleId]?.title || "Season Title"}
              </h1>
              <Seasoncase
                title={seasonData[visibleId]?.title || "Season Title"}
                subtitle={seasonData[visibleId]?.subtitle || "Season Subtitle"}
                colors={seasonData[visibleId]?.colors || []}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
