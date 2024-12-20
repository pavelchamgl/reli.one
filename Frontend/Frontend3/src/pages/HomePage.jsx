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

const HomePage = () => {
  const isMobile = useMediaQuery({ maxWidth: 950 });

  const { pathname } = useLocation();

  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    if (pathname.includes("seller")) {
      setIsSeller(true);
    }
  }, [pathname]);

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
