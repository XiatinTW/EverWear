import Logo from "../../../assets/EVERWEAR_header.svg";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBookmark,
  faUser,
  faCartShopping,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";

// faUserCheck 將設定為登入狀態
export default function Header() {
  const navigationIcons = [
    { alt: "Search", icon: faSearch, ariaLabel: "Search products" },
    { alt: "MemberLogout", icon: faUser, ariaLabel: "User account logout" },
    { alt: "Wish", icon: faBookmark, ariaLabel: "Wishlist" },
    { alt: "Shopping bag", icon: faCartShopping, ariaLabel: "Shopping bag" },
  ];

  return (
    <>
      <header className="flex w-full h-[3rem] bg-white overflow-hidden items-center justify-between px-[1rem] shadow-md">
        <span className="blank-space hidden sm:flex flex-1"></span>
        <div className="brand-name flex-[2] flex justify-center">
          <Link to="/" className="">
            <img
              src={Logo}
              className="w-[9.5rem] object-contain"
              alt="everwear-header-title"
            />
          </Link>
        </div>
        <nav
          className="hidden sm:flex flex-1 items-center justify-end gap-[1.5rem]"
          role="navigation"
          aria-label="Main navigation"
        >
          {navigationIcons.map((icon, index) => (
            <Link to="/#" className="" key={index}>
              <span className="flex items-center justify-center hover:opacity-75 transition-opacity duration-200">
                <FontAwesomeIcon
                  icon={icon.icon}
                  className="text-accent"
                  style={{ fontSize: "1.5rem" }}
                  aria-label={icon.ariaLabel}
                />
              </span>
            </Link>
          ))}
        </nav>
      </header>
      {/* Mobile nav fixed at bottom */}
      <nav
        className="flex sm:hidden fixed bottom-0 left-0 w-full h-[3.5rem] bg-white shadow-t z-50 items-center justify-center gap-[2rem]"
        role="navigation"
        aria-label="Main navigation"
      >
        {navigationIcons.map((icon, index) => (
          <Link to="/#" className="" key={index}>
            <span className="flex items-center justify-center hover:opacity-75 transition-opacity duration-200">
              <FontAwesomeIcon
                icon={icon.icon}
                className="text-accent"
                style={{ fontSize: "1.8rem" }}
                aria-label={icon.ariaLabel}
              />
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
