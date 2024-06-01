import ActualOrdersCard from "../ActualOrdersCard/ActualOrdersCard";
import OrderSchedule from "../OrderSchedule/OrderSchedule";
import OrdersListAndDesc from "../OrdersListAndDesc/OrdersListAndDesc";

import styles from "./ActualSection.module.scss";

const ActualSection = () => {
  return (
    <div className={styles.main}>
      <p className={styles.prodNumber}>
        Objednat <span>№123121</span>
      </p>
      <div className={styles.timeTextWrap}>
        <p className={styles.delivTimeText}>Doručovat budeme do 1. listopadu</p>
        <p className={styles.prodNumber}>
          Čas objednávky: <span>16:08 20.08.2023</span>
        </p>
      </div>
      <OrderSchedule />
      <OrdersListAndDesc />
    </div>
  );
};

export default ActualSection;
