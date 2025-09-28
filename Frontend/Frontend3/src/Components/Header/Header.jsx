import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";

import ChangeLang from "../ChangeLang/ChangeLang";
import CatalogBtn from "../Catalog/CatalogBtn/CatalogBtn";
import SearchInp from "../../ui/SearchInp/SearchInp";
import { AuthNeed } from "../../ui/Toastify";

import logo from "../../assets/Header/Logo.svg";
import profileIcon from "../../assets/Header/profileIcon.svg";
import paketIcon from "../../assets/Header/Paket.svg";
import likeIcon from "../../assets/Header/LikeIcon.svg";
import basketIcon from "../../assets/Header/BasketIcon.svg";
import basketDisabledIcon from "../../assets/Header/BasketDisabledIcon.svg";
import CatalogDrawer from "../Catalog/CatalogDrawer/CatalogDrawer";
import LoginModal from "../LoginModal/LoginModal";

import styles from "./Header.module.css";
import ProfileNavDrawer from "../ProfileNav/ProfileNavDrawer/ProfileNavDrawer";

const Header = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [basketAuth, setBasketAuth] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 950 });

  const { t } = useTranslation();

  const isRegistered = localStorage.getItem("is_registered");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (JSON.parse(isRegistered)) {
      setOpen(true);
      localStorage.removeItem("is_registered");
    } else {
      setOpen(false);
    }
  }, [isRegistered]);

  const handleAuth = () => {
    if (token) {
      setNavOpen(true);
    } else {
      setOpen(true);
    }
  };

  const handleBasketClick = () => {
    // if (token) {
    navigate("/basket");
    setBasketAuth(false);
    // } else {
    //   setBasketAuth(true);
    //   AuthNeed(t("toast.auth_required"));
    // }
  };

  if (isMobile) {
    return (
      <div className={styles.headerMobile}>
        <div className={styles.headerMobTop}>
          <Link to={"/"}>
            <img className={styles.logo} src={logo} alt="" />
          </Link>
          <ChangeLang />
          {/* <ChangeLang /> */}
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
          <Link to={"/for_sell"}>{t("for_seller")}</Link>
          <Link to={"/for_buy"}>{t("for_buyers")}</Link>
          <a href="https://info.reli.one">{t("about_company")}</a>
        </div>
      </div>
      <div className={styles.headerBottomWrap}>
        <div className={styles.headerLogo}>
          <img onClick={() => navigate("/")} src={logo} alt="" />
          <CatalogBtn loginModalOpen={open} profileNavOpen={navOpen} />
        </div>
        <SearchInp />
        <div className={styles.headerBottomLinkWrap}>
          <button onClick={handleAuth} className={styles.headerBottomLink}>
            <img src={profileIcon} alt="" />
            <p>{t("enter_account")}</p>
          </button>
          <button
            onClick={() => navigate("/my_orders")}
            className={styles.headerBottomLink}
          >
            <img src={paketIcon} alt="" />
            <p>{t("orders")}</p>
          </button>
          <button
            onClick={() => navigate("/liked")}
            className={styles.headerBottomLink}
          >
            <img src={likeIcon} alt="" />
            <p>{t("choice")}</p>
          </button>
          <button
            onClick={handleBasketClick}
            className={styles.headerBottomLink}
            disabled={basketAuth}
          >
            <img src={basketAuth ? basketDisabledIcon : basketIcon} alt="" />
            <p>{t("bin")}</p>
          </button>
          {/* <ChangeLang /> */}
        </div>
      </div>
      <ProfileNavDrawer open={navOpen} handleClose={() => setNavOpen(false)} />
      <CatalogDrawer />
      <LoginModal text={"Login"} open={open} handleClose={() => setOpen(false)} />
    </div>
  );
};

export default Header;
