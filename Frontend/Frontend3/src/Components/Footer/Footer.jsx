import { useMediaQuery } from "react-responsive";

import logo from "../../assets/Footer/logo.svg";

import cls from "./Footer.module.css";

const Footer = () => {
  const isMobile = useMediaQuery({ maxWidth: 400 });

  if (isMobile) {
    return (
      <div className={cls.mobileMain}>
        <div className={cls.mobLinkMain}>
          <div>
            <a className={cls.mobileLink} href="#">
              Pro prodejce
            </a>
            <a className={cls.mobileLink} href="#">
              Pro kupující
            </a>
          </div>
          <a className={cls.mobileLink} href="#">
            O společnosti
          </a>
        </div>
        <img className={cls.mobLogo} src={logo} alt="" />
        <h1>gyhujikol</h1>
        <div className={cls.mobInfoContainer}>
          <p>{"Číslo"}: +420 797 837 856</p>
          <p>{"E-mailem"}: oshchepkova.solar@gmail.com</p>
          <p>
            {"Adresa"}: Na Lysinách 551/34, Praha 4 - Hodkovičky, PSČ 147 00
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
            <a className={cls.LinkNavigate} href="#">
              {"Vstoupit"}
            </a>
            <a className={cls.LinkNavigate} href="#">
              {"Zakázky"}
            </a>
            <a className={cls.LinkNavigate} href="#">
              {"Výbor"}
            </a>
            <a className={cls.LinkNavigate} href="#">
              {"Koš"}
            </a>
            <a className={cls.LinkNavigate} href="#">
              {"Staňte se prodejcem"}
            </a>
            <a className={cls.LinkNavigate} href="#">
              {"O společnost"}
            </a>
          </nav>
          <div className={cls.Info_Container}>
            <h1>Reli Group, s.r.o</h1>
            <p>{"Číslo"}: +420 797 837 856</p>
            <p>{"E-mailem"}: oshchepkova.solar@gmail.com</p>
            <p>
              {"Adresa"}: Na Lysinách 551/34, Praha 4 - Hodkovičky, PSČ 147 00
            </p>
          </div>
        </div>
        <p className={cls.bottomDesc}>(c) Copyright 2024 Reli Group</p>
      </div>
    );
  }
};

export default Footer;
