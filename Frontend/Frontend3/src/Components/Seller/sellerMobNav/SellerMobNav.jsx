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
import { logout } from "../../../api/auth";

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





  const token = JSON.parse(localStorage.getItem("token")) || {}


  const handleLogout = () => {
    logout({ refresh_token: token?.refresh }).then((res) => {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      window.location.reload();
    });
  };

  return (
    <div>
      <div className={styles.navMain}>
        <button
          disabled={Object.keys(token).length === 0}
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
        <button
          disabled={Object.keys(token).length === 0}
          onClick={() => navigate("/seller/goods-choice")} className={styles.navItem}>
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
        <button
          disabled={Object.keys(token).length === 0}
          onClick={() => navigate("/seller/seller-order")} className={styles.navItem}>
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
          onClick={() => {
            if (token) {
              handleLogout()
            } else {
              navigate("/seller/login")
            }
          }}
        >
          <img
            src={
              location.pathname === "/seller/login" ? accountAccIcon : accountIcon
            }
            alt=""
          />
          <p
            style={{
              color:
                location.pathname === "/seller/login"
                  ? "#2BAE91"
                  : "#a09e96",
            }}
          >
            {
              token ?
                "Logout" :
                "Account"
            }
          </p>
        </button>
      </div>
    </div>
  );
};

export default SellerMobNav;
