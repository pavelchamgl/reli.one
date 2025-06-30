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

const HomePage = () => {
  const isMobile = useMediaQuery({ maxWidth: 950 });

  const { pathname } = useLocation();

  const [isSeller, setIsSeller] = useState(false);

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


  return (
    <div className={styles.main}>
      {!isSeller && <Header />}
      <div>
        <Outlet />
        {isMobile && <MobNav />}
      </div>
      {!isSeller && <Footer />}
      <ToastContainer />
    </div>
  );
};

export default HomePage;
