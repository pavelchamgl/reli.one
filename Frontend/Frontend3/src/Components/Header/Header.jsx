import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import ChangeLang from "../ChangeLang/ChangeLang";
import CatalogBtn from "../Catalog/CatalogBtn/CatalogBtn";
import SearchInp from "../../ui/SearchInp/SearchInp";

import logo from "../../assets/Header/Logo.svg";
import profileIcon from "../../assets/Header/profileIcon.svg";
import paketIcon from "../../assets/Header/Paket.svg";
import likeIcon from "../../assets/Header/LikeIcon.svg";
import basketIcon from "../../assets/Header/BasketIcon.svg";
import CatalogDrawer from "../Catalog/CatalogDrawer/CatalogDrawer";
import LoginModal from "../LoginModal/LoginModal";

import styles from "./Header.module.css";
import ProfileNavDrawer from "../ProfileNav/ProfileNavDrawer/ProfileNavDrawer";

const Header = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 950 });
  if (isMobile) {
    return (
      <div className={styles.headerMobile}>
        <div className={styles.headerMobTop}>
          <img className={styles.logo} src={logo} alt="" />
          <ChangeLang />
        </div>
        <SearchInp />
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.headerTop}>
        <div className={styles.headerTopWrap}>
          <ChangeLang />
          <Link to={"/for_sell"}>Pro prodejce</Link>
          <Link to={"/for_buy"}>Pro kupující</Link>
          <p>O společnosti</p>
        </div>
      </div>
      <div className={styles.headerBottomWrap}>
        <div className={styles.headerLogo}>
          <img src={logo} alt="" />
          <CatalogBtn />
        </div>
        <SearchInp />
        <div className={styles.headerBottomLinkWrap}>
          <button
            onClick={() => setOpen(!open)}
            className={styles.headerBottomLink}
          >
            <img src={profileIcon} alt="" />
            <p>Vstoupit</p>
          </button>
          <div className={styles.headerBottomLink}>
            <img src={paketIcon} alt="" />
            <p>Objednávky</p>
          </div>
          <button
            onClick={() => navigate("/liked")}
            className={styles.headerBottomLink}
          >
            <img src={likeIcon} alt="" />
            <p>Výběr</p>
          </button>
          <button
            onClick={() => setNavOpen(true)}
            className={styles.headerBottomLink}
          >
            <img src={basketIcon} alt="" />
            <p>Koš</p>
          </button>
        </div>
      </div>
      <ProfileNavDrawer open={navOpen} handleClose={() => setNavOpen(false)} />
      <CatalogDrawer />
      <LoginModal open={open} handleClose={() => setOpen(false)} />
    </div>
  );
};

export default Header;
