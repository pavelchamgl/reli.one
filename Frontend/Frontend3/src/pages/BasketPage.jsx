import { useMediaQuery } from "react-responsive";

import BasketCardBlock from "../Components/Basket/BasketCardBlock/BasketCardBlock";
import BasketTotalBlock from "../Components/Basket/BasketTotalBlock/BasketTotalBlock";

import styles from "../styles/BasketPage.module.scss";
import { useEffect } from "react";
import { useActionPayment } from "../hook/useActionPayment";
import TelegramMeneger from "../Components/TelegramMenedgerBtn/TelegramMeneger";

const BasketPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const { setPageSection } = useActionPayment()

  useEffect(() => {
    setPageSection(1)
  }, [])

  return (
    <>
      {/* {isMobile && <Header />} */}
      <div className={styles.main}>
        <BasketCardBlock />
        <BasketTotalBlock />
      </div>
      <TelegramMeneger />
      {/* {isMobile && <Footer />} */}
    </>
  );
};

export default BasketPage;
