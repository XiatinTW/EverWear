import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import "../../../style/header.css";

function Header({ wishlistCount = 0 }) {
    const navigate = useNavigate();
    const textRef = useRef(null);

    // EVERWEAR字母陣列
    const chars = "EVERWEAR".split("");
    // 中間到兩側的動畫順序
    const getCenterOutOrder = (len) => {
        const order = [];
        const center = Math.floor((len - 1) / 2);
        order.push(center);
        for (let i = 1; order.length < len; i++) {
            if (center - i >= 0) order.push(center - i);
            if (center + i < len) order.push(center + i);
        }
        return order;
    };
    const animOrder = getCenterOutOrder(chars.length);

    // 封裝動畫函式
    const playAnimation = () => {
        const charSpans = textRef.current.querySelectorAll(".gsap-char");
        // 先全部隱藏
        charSpans.forEach(span => {
            gsap.set(span, { opacity: 0, y: 20 });
        });
        // 依照 animOrder 產生動畫
        animOrder.forEach((idx, i) => {
            gsap.to(
                charSpans[idx],
                {
                    opacity: 1,
                    y: 0,
                    delay: i * 0.12,
                    duration: 0.5,
                    ease: "power2.out"
                }
            );
        });
    };

    useEffect(() => {
        playAnimation();
    }, []);

    return (
        <>

            <nav className="home_header">
                <p
                    className="header_logo text-accent "
                    style={{
                        cursor: 
                        "pointer",
                        display: "flex",
                        gap: "2px",
                        justifyContent: "center",
                        letterSpacing: "0.1em"
                    }}
                    ref={textRef}
                    onClick={() => {
                        playAnimation();
                        navigate("/");
                    }}
                >
                    {chars.map((char, idx) => (
                        <span
                            className="gsap-char"
                            key={idx}
                            style={{ opacity: 0, transition: "opacity 0.3s" }}
                        >
                            {char}
                        </span>
                    ))}
                </p>
                <div className="header_links">
                    <a href="/home/search" className="search"></a>
                    <a href="/home/auth" className="member"></a>
                    <div className="wishlist">
                        <span
                            className="bookmark"
                            style={{ position: "relative" }}
                            onClick={() => {
                                navigate("/home/wishlist");
                            }}
                        ></span>
                        {wishlistCount > 0 && (
                            <span
                                className="wishlist-badge"
                                style={{
                                    position: "absolute",
                                    transform: "translateX(12px) translateY(-12px)",
                                    background: "#e74c3c",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    height: "18px",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "0 5px",
                                    fontWeight: "bold",
                                    zIndex: 1,
                                    width: "auto",
                                    overflow: "visible"
                                }}
                            >
                                {wishlistCount}
                            </span>
                        )}
                    </div>
                    <a href="/home/cart" className="shopping_bag"></a>
                </div>
            </nav>
            <nav className="home_header_medium">
                <div className="header_links">
                    <a href="/home/search" className="search"></a>
                    <a href="/home/auth" className="member"></a>
                    <div className="wishlist">
                        <span
                            className="bookmark"
                            style={{ position: "relative" }}
                            onClick={() => {
                                navigate("/home/wishlist");
                            }}
                        ></span>
                        {wishlistCount > 0 && (
                            <span
                                className="wishlist-badge"
                                style={{
                                    position: "absolute",
                                    transform: "translateX(12px) translateY(-12px)",
                                    background: "#e74c3c",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    height: "18px",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "0 5px",
                                    fontWeight: "bold",
                                    zIndex: 1,
                                    width: "auto",
                                    overflow: "visible"
                                }}
                            >
                                {wishlistCount}
                            </span>
                        )}
                    </div>
                    <a href="/home/cart" className="shopping_bag"></a>
                </div>
            </nav>
        </>
    );
}

export default Header;