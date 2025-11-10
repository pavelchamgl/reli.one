import { Outlet } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

import styles from "../styles/HomePage.module.scss";
import MobNav from "../Components/MobNav/MobNav";
import { deselectAllProducts, syncBasket } from "../redux/basketSlice";
import { useActionPayment } from "../hook/useActionPayment";
import { useDispatch, useSelector } from "react-redux";
import ScrollToTop from "../Components/ScrollToTop/ScrollToTop";
import CookieModal from "../ui/CookieModal/CookieModal";
import { COOKIE_VERSION } from "../configs/cookieConfig";

const HomePage = () => {
  const isMobile = useMediaQuery({ maxWidth: 950 });

  const { pathname } = useLocation();

  const [isSeller, setIsSeller] = useState(false);
  const [openCookie, setOpenCookie] = useState(false)

  const cookieSave = localStorage.getItem("cookieSave")

  useEffect(() => {
    if (pathname.includes("seller")) {
      setIsSeller(true);
    }
  }, [pathname]);

  const location = useLocation();
  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket.basket);

  const { setPageSection } = useActionPayment()

  // useEffect(() => {
  //   const currentPath = location.pathname;

  //   // Если текущий путь не является "basket", "payment" или "mob_basket", снимаем выделение
  //   if (
  //     currentPath !== "/basket" &&
  //     currentPath !== "/payment" &&
  //     currentPath !== "/mob_basket"
  //   ) {
  //     dispatch(deselectAllProducts());
  //   }
  // }, [location]);

  useEffect(() => {
    const currentPath = location.pathname;

    // Если текущий путь не является "basket", "payment" или "mob_basket", снимаем выделение
    if (
      currentPath !== "/payment"
    ) {
      setPageSection(1)
    }
  }, [location]);

  useEffect(() => {
    if (!cookieSave && pathname !== "/general-protection" && pathname !== "/privacy-policy") {
      setOpenCookie(true)
      localStorage.setItem("i18nextLng", "en")
    }
  }, [pathname])

  useEffect(() => {
    const cookieVersion = localStorage.getItem("COOKIE_VERSION")

    if (COOKIE_VERSION !== cookieVersion) {

      localStorage.setItem("COOKIE_VERSION", COOKIE_VERSION)
      localStorage.removeItem("cookieSave")
    }

  }, [])


  return (
    <div className={styles.main}>
      {!isSeller && <Header />}
      <div>
        <ScrollToTop />
        <Outlet />
        {isMobile && <MobNav />}
      </div>
      {!isSeller && <Footer />}
      <ToastContainer />
      <CookieModal open={openCookie} handleClose={() => setOpenCookie(false)} />
    </div>
  );
};

export default HomePage;
