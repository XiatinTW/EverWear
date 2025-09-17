import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSquareInstagram,
  faFacebook,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import Logo from "../../../assets/EVERWEAR_header_light.png";

export default function Footer() {
  const socialIcons = [
    {
      alt: "Instagram",
      icon: faSquareInstagram,
      url: "https://www.instagram.com/",
    },
    {
      alt: "Facebook",
      icon: faFacebook,
      url: "https://www.facebook.com/",
    },
    {
      alt: "Youtube",
      icon: faYoutube,
      url: "https://www.youtube.com/",
    },
  ];

  return (
    <>
      <footer className="flex w-full justify-between p-[1.5rem] shadow-md bg-accent relative" style={ { paddingBottom: 50}}>
        <div className="footer-container flex flex-col w-full gap-[3rem] justify-start items-start sm:gap-[1.8rem]">
          <div className="sm:self-stretch flex flex-col gap-[4rem] sm:flex-row justify-start">
            <div className="logo-container flex justify-start sm:justify-end sm:ml-auto">
              <Link to="/">
                <img
                  src={Logo}
                  className="w-[12rem] object-contain"
                  alt="everwear-footer-title"
                />
              </Link>
            </div>
            <div className="links-group flex w-[50vw] gap-[2rem] justify-start sm:justify-end sm:gap-[4rem] flex-wrap sm:flex-auto">
              <Link to="/home/brandstory">
                <h6 className="text-[18px] text-nowrap text-secondary justify-center flex hover:opacity-75 transition-opacity duration-200" style={{color: 'var(--color-secondary_2) !important' }}>
                  品牌故事
                </h6>
              </Link>
              <Link to="/home/itempage">
                <h6 className="text-[18px] h-auto text-nowrap text-secondary justify-center flex hover:opacity-75 transition-opacity duration-200" style={{color: 'var(--color-secondary_2) !important'}}>
                  最新商品
                </h6>
              </Link>
              <Link to="/home/account">
                <h6 className="text-[18px] text-nowrap text-secondary justify-center flex hover:opacity-75 transition-opacity duration-200" style={{color: 'var(--color-secondary_2) !important'}}>
                  會員服務
                </h6>
              </Link>
              <Link to="/home/skincolor">
                <h6 className="text-[18px] text-nowrap text-secondary justify-center flex hover:opacity-75 transition-opacity duration-200" style={{color: 'var(--color-secondary_2) !important'}}>
                  膚色小測驗
                </h6>
              </Link>
              <Link to="/home/account">
                <h6 className="text-[18px] text-nowrap text-secondary justify-center flex hover:opacity-75 transition-opacity duration-200" style={{color: 'var(--color-secondary_2) !important'}}>
                  聯絡我們
                </h6>
              </Link>
            </div>
          </div>

          {/* 社群媒體連結 */}
          <div
            className="flex flex-1 items-center sm:justify-end gap-[1.5rem]"
            role="socialMedia"
            aria-label="socialMedia links"
          >
            {socialIcons.map((icon, index) => (
              <a
                href={icon.url}
                target="_blank"
                rel="noopener noreferrer"
                className=""
                key={index}
              >
                <span className="flex w-[1.8rem] items-center justify-center hover:opacity-75 transition-opacity duration-200">
                  <FontAwesomeIcon
                    icon={icon.icon}
                    className="text-secondary"
                    style={{ fontSize: "1.8rem", color: 'var(--color-secondary_2) !important' }}
                  />
                </span>
              </a>
            ))}
          </div>
          <div className="contact-info w-96 justify-start">
            <p className=" text-secondary text-left" style={{color: 'var(--color-secondary_2) !important' }}>
              聯絡資訊
              <br />
              客服時間：10:00 - 18:00 ( UTC+8 )
              <br />
              信箱：everwear@gmail.com
            </p>
          </div>
          <div
            className="flex w-full -mt-[20px] text-center justify-center sm:mt-[-3rem] 
          mb-[3rem] sm:mb-[1rem] sm:justify-end text-white text-base"
          >
            <p className="flex text-secondary text-[0.9rem]" style={{color: 'var(--color-secondary_2) !important' }}>
              Copyright © EverWear All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
