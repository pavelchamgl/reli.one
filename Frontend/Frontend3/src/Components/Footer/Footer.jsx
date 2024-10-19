import { useMediaQuery } from "react-responsive";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import logo from "../../assets/Footer/logo.svg";

import cls from "./Footer.module.css";
import LoginModal from "../LoginModal/LoginModal";

const Footer = () => {
  const isMobile = useMediaQuery({ maxWidth: 400 });
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className={cls.mobileMain}>
        <div className={cls.mobLinkMain}>
          <div>
            <Link to={"/for_sell"} className={cls.mobileLink} href="#">
              {t("for_seller")}
            </Link>
            <Link to={"/for_buy"} className={cls.mobileLink} href="#">
              {t("for_buyers")}
            </Link>
          </div>
          <a className={cls.mobileLink} href="https://info.reli.one">
            {t("about_company")}
          </a>
        </div>
        <img className={cls.mobLogo} src={logo} alt="" />
        <div className={cls.mobInfoContainer}>
          <p>{t("phone")}: +420 797 837 856</p>
          <p>{t("email")}: oshchepkova.reli@gmail.com</p>
          <p>
            {t("address")}: {t("reli_address")}
          </p>
        </div>

        <p className={cls.mobBottomDesc}>(c) Copyright 2024 Reli Group</p>
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
            <p>{t("email")}: oshchepkova.reli@gmail.com</p>
            <p>
              {t("address")}: {t("reli_address")}
            </p>
          </div>
        </div>
        <p className={cls.bottomDesc}>(c) Copyright 2024 Reli Group</p>
        <LoginModal open={open} handleClose={() => setOpen(false)} />
      </div>
    );
  }
};

export default Footer;
