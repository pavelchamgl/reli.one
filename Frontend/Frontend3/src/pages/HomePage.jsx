import { Outlet } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

import styles from "../styles/HomePage.module.scss";
import MobNav from "../Components/MobNav/MobNav";

const HomePage = () => {
  const isMobile = useMediaQuery({ maxWidth: 950 });

  return (
    <div className={styles.main}>
      <Header />
      <div>
        <Outlet />
        {isMobile && <MobNav />}
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default HomePage;
