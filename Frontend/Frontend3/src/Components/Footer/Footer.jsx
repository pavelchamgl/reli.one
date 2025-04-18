import { useMediaQuery } from "react-responsive";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import logo from "../../assets/Footer/logo.svg";
import instaIcon from "../../assets/Footer/insta.svg";
import faceIcon from "../../assets/Footer/facebook.svg";
import LoginModal from "../LoginModal/LoginModal";

import cls from "./Footer.module.scss";


const MessengerBtns = () => {
  return (
    <div className={cls.messBtns}>
      <a target="_blank" href="https://www.instagram.com/reli_just_one?igsh=MXU5b3RjcjhraXR0cQ%3D%3D&utm_source=qr">
        <img src={instaIcon} alt="" />
        <p>instagram</p>
      </a>
      <a target="_blank" href="https://www.facebook.com/share/1H2tBL8yDB/?mibextid=wwXIfr">
        <img src={faceIcon} alt="" />
        <p>facebook</p>
      </a>
    </div>
  )
}

const Footer = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className={cls.mobileMain}>
        <MessengerBtns />
        <div className={cls.mobLinkMain}>
          <Link className={cls.mobileLink} to={"/mob_login"}>
            Log in
          </Link>
          <Link className={cls.mobileLink} to={"/my_orders"}>
            Orders
          </Link>
          <Link to={"/for_sell"} className={cls.mobileLink} href="#">
            {t("for_seller")}
          </Link>
          <Link to={"/for_buy"} className={cls.mobileLink} href="#">
            {t("for_buyers")}
          </Link>
          <a className={cls.mobileLink} href="https://info.reli.one">
            {t("about_company")}
          </a>
        </div>
        <img className={cls.mobLogo} src={logo} alt="" />
        <div className={cls.mobInfoContainer}>
          <p>{t("phone")}: +420 797 837 856</p>
          <p>{t("email")}: info.reli.one@gmail.com</p>
          <p>
            {t("address")}: {t("reli_address")}
          </p>
        </div>
        <div className={cls.mobBottomWrap}>
          <p className={cls.mobBottomDesc}>(c) Copyright 2025 Reli Group</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className={cls.Foooter_Container}>
        <div className={cls.Inner_Container}>
          <div className={cls.logo_container}>
            <img src={logo} />
          </div>
          <nav className={cls.Navigate_Container}>
            <button className={cls.btnNavigate} onClick={() => setOpen(!open)}>
              {t("enter_account")}
            </button>
            <Link className={cls.LinkNavigate} to={"/my_orders"}>
              {t("footer_order")}
            </Link>
            <Link className={cls.LinkNavigate} to={"/liked"}>
              {t("choice")}
            </Link>
            {token && (
              <Link to={"/basket"} className={cls.LinkNavigate}>
                {t("bin")}
              </Link>
            )}
            <Link to={"/for_sell"} className={cls.LinkNavigate} href="#">
              {t("for_seller")}
            </Link>
            <Link to={"/for_buy"} className={cls.LinkNavigate} href="#">
              {t("for_buyers")}
            </Link>
            <Link className={cls.LinkNavigate} to="https://info.reli.one">
              {t("about_company")}
            </Link>
          </nav>
          <div className={cls.Info_Container}>
            <h1>Reli Group, s.r.o</h1>
            <p>{t("phone")}: +420 797 837 856</p>
            <p>{t("email")}: info.reli.one@gmail.com</p>
            <p>
              {t("address")}: {t("reli_address")}
            </p>
          </div>
        </div>
        <div className={cls.bottomElem}>
          <MessengerBtns />
          <p className={cls.bottomDesc}>(c) Copyright 2025 Reli Group</p>
        </div>
        <LoginModal open={open} handleClose={() => setOpen(false)} />
      </div>
    );
  }
};

export default Footer;
