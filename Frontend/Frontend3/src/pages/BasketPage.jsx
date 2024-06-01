import BasketCardBlock from "../Components/Basket/BasketCardBlock/BasketCardBlock";
import BasketTotalBlock from "../Components/Basket/BasketTotalBlock/BasketTotalBlock";

import styles from "../styles/BasketPage.module.scss";

const BasketPage = () => {
  return (
    <div className={styles.main}>
      <BasketCardBlock />
      <BasketTotalBlock />
    </div>
  );
};

export default BasketPage;
