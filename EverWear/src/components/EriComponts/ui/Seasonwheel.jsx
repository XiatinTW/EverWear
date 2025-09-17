import React, { useRef, useEffect } from "react";
import styles from "../../../style/Seasonwheel.module.css";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(Observer, ScrollTrigger, ScrollSmoother);

export default function Seasonwheel({ onVisibleChange }) {
  const carouselRef = useRef(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    const images = carousel.querySelectorAll(".carousel-image");
    const radius = 242;
    const progress = { value: 0 };

    // GSAP Observer setup
    Observer.create({
      target: carousel,
      type: "wheel,pointer",
      onPress: (self) => {
        carousel.style.cursor = "grabbing";
      },
      onRelease: (self) => {
        carousel.style.cursor = "grab";
      },
      onChange: (self) => {
        gsap.killTweensOf(progress);
        const p =
          self.event.type === "wheel"
            ? self.deltaY * -0.0005
            : self.deltaX * 0.05;
        gsap.to(progress, {
          duration: 2,
          ease: "power4.out",
          value: `+=${p}`,
        });
      },
    });

    const animate = () => {
      images.forEach((image, index) => {
        const theta = index / images.length - progress.value;
        const x = -Math.sin(theta * Math.PI * 2) * radius;
        const y = Math.cos(theta * Math.PI * 2) * radius;
        image.style.transform = `translate3d(${x}px, 0px, ${y}px) rotateY(${
          360 * -theta
        }deg)`;
      });
    };
    gsap.ticker.add(animate);

    // IntersectionObserver setup
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisibleChange(entry.target.id); // Call the callback with the visible ID
          }
        });
      },
      {
        root: carousel, // 使用 carousel 作為 root
        rootMargin: "0px", // 確保範圍不會隨畫面變大
        threshold: 0.5, // 元素進入 50% 可視範圍時觸發
      }
    );

    // 固定可視範圍的大小
    // carousel.style.outline = "2px dashed red"; // 添加紅色虛線框作為可視範圍標記
    carousel.style.overflow = "hidden"; // 確保內容不超出範圍
    carousel.style.maxWidth = "500px"; // 固定寬度
    carousel.style.minWidth = "500px"; // 固定寬度
    carousel.style.maxHeight = "500px"; // 固定高度
    carousel.style.minHeight = "500px"; // 固定高度

    images.forEach((image) => observer.observe(image));

    return () => {
      gsap.ticker.remove(animate);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={carouselRef} className={`carousel ${styles.carousel}`}>
      <div
        id="1"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #cd9cf2 0%, #f6f3ff 100%)",
        }}
      />
      <div
        id="2"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #cd9cf2 0%, #f6f3ff 100%)",
        }}
      />
      <div
        id="3"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #4fb576 0%, #44c489 30%, #28a9ae 46%, #28a2b7 59%, #4c7788 71%, #6c4f63 86%, #432c39 100%)",
        }}
      />
      <div
        id="4"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #4fb576 0%, #44c489 30%, #28a9ae 46%, #28a2b7 59%, #4c7788 71%, #6c4f63 86%, #432c39 100%)",
        }}
      />
      <div
        id="5"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #f83600 0%, #f9d423 100%)",
        }}
      />
      <div
        id="6"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #f83600 0%, #f9d423 100%)",
        }}
      />
      <div
        id="7"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #13547a 0%, #80d0c7 100%)",
        }}
      />
      <div
        id="8"
        className={`carousel-image ${styles.carouselImage}`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, #13547a 0%, #80d0c7 100%)",
        }}
      />
    </div>
  );
}
