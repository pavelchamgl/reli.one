import { useState } from "react";

import OrdersListAndDesc from "../OrdersListAndDesc/OrdersListAndDesc";
import arrTop from "../../../assets/Order/arrTop.svg";

import styles from "./HistorySection.module.scss";
import HistorySmallCard from "../HistorySmallCard/HistorySmallCard";

const HistorySection = () => {
  const [small, setSmall] = useState(true);

  if (small) {
    return (
      <div className={styles.main}>
        <div>
          <div className={styles.buttonDiv}>
            <p className={styles.prodNumber}>
              Objednat <span>№123121</span>
            </p>
            <button onClick={()=>setSmall(!small)}>
              <img src={arrTop} alt="" />
            </button>
          </div>
          <div className={styles.timeTextWrap}>
            <p className={styles.prodNumber}>
              Čas objednávky: <span>16:08 20.08.2023</span>
            </p>
            <p className={styles.delivTimeText}>
              Doručovat budeme do 1. listopadu
            </p>
          </div>
        </div>
        <OrdersListAndDesc />
      </div>
    );
  } else {
    return (
      <div onClick={()=>setSmall(!small)} className={styles.main}>
        <HistorySmallCard />
      </div>
    );
  }
};

export default HistorySection;
