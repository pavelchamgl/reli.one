import { useMediaQuery } from "react-responsive";

import Header from "../Components/Header/Header";
import BasketCardBlock from "../Components/Basket/BasketCardBlock/BasketCardBlock";
import BasketTotalBlock from "../Components/Basket/BasketTotalBlock/BasketTotalBlock";
import Footer from "../Components/Footer/Footer";

import styles from "../styles/BasketPage.module.scss";

const BasketPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });

  return (
    <>
      {/* {isMobile && <Header />} */}
      <div className={styles.main}>
        <BasketCardBlock />
        <BasketTotalBlock />
      </div>
      {/* {isMobile && <Footer />} */}
    </>
  );
};

export default BasketPage;
