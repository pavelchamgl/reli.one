import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CatalogDrawer from "../Catalog/CatalogDrawer/CatalogDrawer";
import homeIcon from "../../assets/mobNav/homeIcon.svg";
import homeIconAcc from "../../assets/mobNav/homeIconAct.svg";
import categoryIcon from "../../assets/mobNav/categoryIcon.svg";
import categoryIconAcc from "../../assets/mobNav/categoryIconAct.svg";
import basketIconAcc from "../../assets/mobNav/basketIconAcc.svg";
import basketIcon from "../../assets/mobNav/BasketIcon.svg";
import likeIcon from "../../assets/mobNav/likeIcon.svg";
import likeIconAcc from "../../assets/mobNav/likeIconAcc.svg";
import profileIcon from "../../assets/mobNav/profileIcon.svg";
import profileIconAcc from "../../assets/mobNav/profileIconAcc.svg";
import { AuthNeed } from "../../ui/Toastify";

import styles from "./MobNav.module.scss";

const MobNav = () => {
  const [showButton, setShowButton] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Проверка направления прокрутки
      if (scrollTop > lastScrollTop) {
        // Прокрутка вниз
        setShowButton(true);
      } else {
        // Прокрутка вверх
        setShowButton(false);
      }

      setLastScrollTop(scrollTop <= 0 ? 0 : scrollTop); // Обновление позиции прокрутки
    };

    // Добавление обработчика события scroll
    window.addEventListener("scroll", handleScroll);

    // Очистка обработчика при размонтировании компонента
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollTop]);

  const handleLoginClick = () => {
    if (token) {
      navigate("/mob_profile_nav");
    } else {
      navigate("/mob_login");
    }
  };
  const handleBasketClick = () => {
    if (token) {
      navigate("/mob_basket");
    } else {
      AuthNeed(t("toast.auth_required"));
    }
  };

  return (
    <div>
      {showButton && (
        <>
          <div className={styles.navMain}>
            <button onClick={() => navigate("/")} className={styles.navItem}>
              <img
                src={location.pathname === "/" ? homeIconAcc : homeIcon}
                alt=""
              />
              <p
                style={{
                  color: location.pathname === "/" ? "#F5B80B" : "#a09e96",
                }}
              >
                {t("home")}
              </p>
            </button>
            <button onClick={() => setOpen(!open)} className={styles.navItem}>
              <img src={categoryIcon} alt="" />
              <p
                style={
                  {
                    // color: location.pathname === "/" ? "#F5B80B" : "#a09e96",
                  }
                }
              >
                {t("category")}
              </p>
            </button>
            <button onClick={handleBasketClick} className={styles.navItem}>
              <img
                src={
                  location.pathname === "/mob_basket"
                    ? basketIconAcc
                    : basketIcon
                }
                alt=""
              />
              <p
                style={{
                  color:
                    location.pathname === "/mob_basket" ? "#F5B80B" : "#a09e96",
                }}
              >
                {t("bin")}
              </p>
            </button>
            <button
              onClick={() => navigate("/liked")}
              className={styles.navItem}
            >
              <img
                src={location.pathname === "/liked" ? likeIconAcc : likeIcon}
                alt=""
              />
              <p
                style={{
                  color: location.pathname === "/liked" ? "#F5B80B" : "#a09e96",
                }}
              >
                {t("choice")}
              </p>
            </button>
            {/* /mob_profile_nav */}
            {/* /mob_login */}
            <button onClick={handleLoginClick} className={styles.navItem}>
              <img
                src={
                  location.pathname === "/mob_login"
                    ? profileIconAcc
                    : profileIcon
                }
                alt=""
              />
              <p
                style={{
                  color:
                    location.pathname === "/mob_login" ? "#F5B80B" : "#a09e96",
                }}
              >
                {t("enter_account")}
              </p>
            </button>
          </div>
          <CatalogDrawer open={open} handleClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
};

export default MobNav;
