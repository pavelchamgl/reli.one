import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import homeIcon from "../../../assets/Seller/mobNav/home.svg"
import homeAccIcon from "../../../assets/Seller/mobNav/homeAcc.svg"
import goodsIcon from "../../../assets/Seller/mobNav/goods.svg"
import goodsAccIcon from "../../../assets/Seller/mobNav/goodsAcc.svg"
import ordersIcon from "../../../assets/Seller/mobNav/orders.svg"
import ordersAccIcon from "../../../assets/Seller/mobNav/ordersAcc.svg"
import accountIcon from "../../../assets/Seller/mobNav/account.svg"
import accountAccIcon from "../../../assets/Seller/mobNav/accountAcc.svg"

import styles from "./SellereMobNav.module.scss";

const SellerMobNav = () => {
  const [showButton, setShowButton] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [open, setOpen] = useState(false);


  const location = useLocation();
  const navigate = useNavigate();


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

  // ? на случай логина
  // const handleLoginClick = () => {
  //   setOpen(false);
  //   if (token) {
  //     navigate("/mob_profile_nav");
  //   } else {
  //     navigate("/mob_login");
  //   }
  // };


  return (
    <div>
      <div className={styles.navMain}>
        <button
          onClick={() => {
            navigate("/seller/seller-home");
          }}
          className={styles.navItem}
        >
          <img
            src={location.pathname === "/seller/seller-home" ? homeAccIcon : homeIcon}
            alt=""
          />
          <p
            style={{
              color:
                location.pathname === "/seller/seller-home" && !open ? "#2BAE91" : "#a09e96",
            }}
          >
            Home
          </p>
        </button>
        <button onClick={() => navigate("/seller/goods-choice")} className={styles.navItem}>
          <img
            src={
              location.pathname === "/seller/goods-choice" ||
                location.pathname === "/seller/goods-list" ||
                location.pathname === "/seller/seller-preview" ||
                location.pathname === "/seller/seller-create"
                ? goodsAccIcon
                : goodsIcon
            }
            alt=""
          />
          <p
            style={{
              color:
                location.pathname === "/seller/goods-choice" ||
                  location.pathname === "/seller/goods-list" ||
                  location.pathname === "/seller/seller-preview" ||
                  location.pathname === "/seller/seller-create"
                  ? "#2BAE91"
                  : "#a09e96",
            }}
          >
            Goods
          </p>
        </button>
        <button onClick={() => navigate("/seller/seller-order")} className={styles.navItem}>
          <img
            src={
              location.pathname === "/seller/seller-order"
                ? ordersAccIcon
                : ordersIcon
            }
            alt=""
          />
          <p
            style={{
              color:
                location.pathname === "/seller/seller-order" && !open
                  ? "#2BAE91"
                  : "#a09e96",
            }}
          >
            Orders
          </p>
        </button>
        <button
          className={styles.navItem}
        >
          <img
            src={
              location.pathname === "/seller" ? accountAccIcon : accountIcon
            }
            alt=""
          />
          <p
            style={{
              color:
                location.pathname === "/seller"
                  ? "#2BAE91"
                  : "#a09e96",
            }}
          >
            Account
          </p>
        </button>
        {/* /mob_profile_nav */}
        {/* /mob_login */}

        {/* на случай логина */}
        {/* <button onClick={handleLoginClick} className={styles.navItem}>
          <img
            src={
              (location.pathname === "/mob_login" ||
                location.pathname === "/mob_profile_nav") &&
                !open
                ? profileIconAcc
                : profileIcon
            }
            alt=""
          />
          <p
            style={{
              color:
                (location.pathname === "/mob_login" ||
                  location.pathname === "/mob_profile_nav") &&
                  !open
                  ? "#F5B80B"
                  : "#a09e96",
            }}
          >
            {t("enter_account")}
          </p>
        </button> */}
      </div>
    </div>
  );
};

export default SellerMobNav;
