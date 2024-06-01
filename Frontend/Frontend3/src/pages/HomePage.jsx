import { Outlet } from "react-router-dom";

import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";

import styles from "../styles/HomePage.module.scss";

const HomePage = () => {
  return (
    <div className={styles.main}>
      <Header />
      <div>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
