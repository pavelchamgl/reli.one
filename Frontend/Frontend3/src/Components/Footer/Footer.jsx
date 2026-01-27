import { useMediaQuery } from "react-responsive";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import logo from "../../assets/Footer/logo.svg";
import instaIcon from "../../assets/Footer/insta.svg";
import faceIcon from "../../assets/Footer/facebook.svg";
import telegaIcon from "../../assets/Footer/tel.svg"
import tiktokIcon from "../../assets/Footer/tiktok.svg"
import linkedinIcon from "../../assets/Footer/linkedin.svg"
import stripe from "../../assets/Footer/stripe.svg"
import paypal from "../../assets/Footer/paypal.svg"
import applePay from "../../assets/Footer/applepay.svg"
import googlePay from "../../assets/Footer/googlePay.svg"
import visa from "../../assets/Footer/visa.svg"
import mastercard from "../../assets/Footer/mastercard.svg"
import maestro from "../../assets/Footer/maestro.svg"


import LoginModal from "../LoginModal/LoginModal";

import cls from "./Footer.module.scss";
import PolicySettingsModal from "../../ui/PolicySettingsModal/PolicySettingsModal";


const MessengerBtns = () => {
  return (
    <div className={cls.messBtns}>
      <a target="_blank" href="https://www.instagram.com/reli_just_one?igsh=MXU5b3RjcjhraXR0cQ%3D%3D&utm_source=qr">
        <img src={instaIcon} alt="" />
        {/* <p>instagram</p> */}
      </a>
      <a target="_blank" href="https://www.facebook.com/share/1H2tBL8yDB/?mibextid=wwXIfr">
        <img src={faceIcon} alt="" />
        {/* <p>facebook</p> */}
      </a>
      {/* <a target="_blank" href="https://t.me/reli_marketplace">
        <img src={telegaIcon} alt="" />
      </a> */}
      <a target="_blank" href="https://www.tiktok.com/@reli.one_new_one?_t=ZN-8xVXbMFsNQk&_r=1">
        <img src={tiktokIcon} alt="" />
        {/* <p>tiktok</p> */}
      </a>
      <a target="_blank" href="https://www.linkedin.com/company/reli-group/">
        <img src={linkedinIcon} alt="" />
        {/* <p>linkedin</p> */}
      </a>
    </div>
  )
}

const Footer = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const [open, setOpen] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(false)

  const { t, i18n } = useTranslation();

  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  const paymentImages = [
    stripe,
    paypal,
    applePay,
    googlePay,
    visa,
    mastercard,
    maestro
  ]

  if (isMobile) {
    return (
      <div className={cls.mobileMain}>
        <img className={cls.mobLogo} src={logo} alt="" />
        <div className={cls.mobInfoContainer}>
          <p>{t("footer_additional.company_id")}: <span >28003896</span></p>
          <p>{t("footer_additional.vat")}: <span >CZ28003896</span></p>
          <p>{t("footer_additional.number")}: <span>+420 797 837 856</span></p>
          <p>{t("email")}: info@reli.one</p>
          <p>
            {t("address")}: {t("reli_address")}
          </p>
        </div>
        <MessengerBtns />
        <nav className={cls.Navigate_Container}>
          <ul>
            <h3>{t("footer_additional.for_clients")}</h3>
            <li>
              <button className={cls.btnNavigate} onClick={() => setOpen(!open)}>
                {t("enter_account")}
              </button>
            </li>
            <li>
              <Link className={cls.LinkNavigate} to={"/my_orders"}>
                {t("footer_order")}
              </Link>
            </li>
            <li>
              <Link className={cls.LinkNavigate} to={"/liked"}>
                {t("choice")}
              </Link>
            </li>
            <li>
              <Link className={cls.LinkNavigate} to={"/basket"}>
                {t("bin")}
              </Link>
            </li>
          </ul>

          <ul>
            <h3>{t("footer_additional.for_providers")}</h3>

            <li>
              <Link to={"/for_sell"} className={cls.LinkNavigate} href="#">
                {t("for_seller")}
              </Link>
            </li>
            <li>
              <Link to={"/for_buy"} className={cls.LinkNavigate} href="#">
                {t("for_buyers")}
              </Link>
            </li>

            <li>
              <button onClick={() => setOpenPolicy(true)} className={cls.btnNavigate} href="#">
                {t("privacySettings")}
              </button>
            </li>
          </ul>

          <ul>
            <h3>{t("footer_additional.section_title")}</h3>
            <li>
              <Link className={cls.LinkNavigate}>
                {t("footer_additional.complaints_procedure")}
              </Link>
            </li>
            <li>
              <Link className={cls.LinkNavigate}>
                {t("footer_additional.returns_procedure")}
              </Link>
            </li>
            <li>
              <Link className={cls.LinkNavigate}>
                {t("footer_additional.complaint_form")}
              </Link>
            </li>
            <li>
              <Link className={cls.LinkNavigate}>
                {t("footer_additional.return_form")}
              </Link>
            </li>
            <li>
              <Link className={cls.LinkNavigate}>
                {t("footer_additional.contacts")}
              </Link>
            </li>

          </ul>

          <ul>
            <h3>{t("footer_additional.company")}</h3>
            <li>
              <Link className={cls.LinkNavigate} to="/contact">
                {t("footer_additional.contact")}
              </Link>
            </li>
            <li>
              <Link className={cls.LinkNavigate} to="https://info.reli.one">
                {t("about_company")}
              </Link>
            </li>
          </ul>

        </nav>




        <div className={cls.mobBottomWrap}>
          <p className={cls.mobBottomDesc}>{t("footer_additional.copyright")}</p>
        </div>

        <div className={cls.payMethodWrap}>
          <h2>{t("footer_additional.payment_methods")}</h2>
          <div>
            {
              paymentImages.map((img) => (
                <img src={img} alt="" />
              ))
            }
          </div>
        </div>
        <PolicySettingsModal open={openPolicy} handleClose={() => setOpenPolicy(false)} />

      </div>
    );
  } else {
    return (
      <div className={cls.Foooter_Container}>
        <div className={cls.Inner_Container}>
          <div className={cls.logo_container}>
            <img className={cls.logo} src={logo} />
            <div className={cls.Info_Container}>
              {/* <h1>Reli Group s.r.o.</h1> */}
              <p>{t("footer_additional.company_id")}: <span >28003896</span></p>
              <p>{t("footer_additional.vat")}: <span >CZ28003896</span></p>
              <p>{t("footer_additional.number")}: <span>+420 797 837 856</span></p>
              <p>{t("email")}: info@reli.one</p>
              <p>
                {t("address")}: <span>{t("reli_address")}</span>
              </p>
            </div>

            <MessengerBtns />

          </div>
          <nav className={cls.Navigate_Container}>
            <ul>
              <h3>{t("footer_additional.for_clients")}</h3>
              <li>
                <button className={cls.btnNavigate} onClick={() => setOpen(!open)}>
                  {t("enter_account")}
                </button>
              </li>
              <li>
                <Link className={cls.LinkNavigate} to={"/my_orders"}>
                  {t("footer_order")}
                </Link>
              </li>
              <li>
                <Link className={cls.LinkNavigate} to={"/liked"}>
                  {t("choice")}
                </Link>
              </li>
              <li>
                <Link className={cls.LinkNavigate} to={"/basket"}>
                  {t("bin")}
                </Link>
              </li>
            </ul>

            <ul>
              <h3>{t("footer_additional.for_providers")}</h3>

              <li>
                <Link to={"/for_sell"} className={cls.LinkNavigate} href="#">
                  {t("for_seller")}
                </Link>
              </li>
              <li>
                <Link to={"/for_buy"} className={cls.LinkNavigate} href="#">
                  {t("for_buyers")}
                </Link>
              </li>

              <li>
                <button onClick={() => setOpenPolicy(true)} className={cls.btnNavigate} href="#">
                  {t("privacySettings")}
                </button>
              </li>
            </ul>

            <ul>
              <h3>{t("footer_additional.section_title")}</h3>
              <li>
                <Link className={cls.LinkNavigate}>
                  {t("footer_additional.complaints_procedure")}
                </Link>
              </li>
              <li>
                <Link className={cls.LinkNavigate}>
                  {t("footer_additional.returns_procedure")}
                </Link>
              </li>
              <li>
                <Link className={cls.LinkNavigate}>
                  {t("footer_additional.complaint_form")}
                </Link>
              </li>
              <li>
                <Link className={cls.LinkNavigate}>
                  {t("footer_additional.return_form")}
                </Link>
              </li>
              <li>
                <Link className={cls.LinkNavigate}>
                  {t("footer_additional.contacts")}
                </Link>
              </li>

            </ul>

            <ul>
              <h3>{t("footer_additional.company")}</h3>
              <li>
                <Link className={cls.LinkNavigate} to="/contact">
                  {t("footer_additional.contact")}
                </Link>
              </li>
              <li>
                <Link className={cls.LinkNavigate} to="https://info.reli.one">
                  {t("about_company")}
                </Link>
              </li>
            </ul>


          </nav>



          <div className={cls.bottomElem}>
            <p className={cls.bottomDesc}>{t("footer_additional.copyright")}</p>
          </div>
        </div>
        <div className={cls.payMethodWrap}>
          <h2>{t("footer_additional.payment_methods")}</h2>
          <div>
            {
              paymentImages.map((img) => (
                <img src={img} alt="" />
              ))
            }
          </div>
        </div>
        <LoginModal open={open} handleClose={() => setOpen(false)} />
        <PolicySettingsModal open={openPolicy} handleClose={() => setOpenPolicy(false)} />
      </div>
    );
  }
};

export default Footer;
