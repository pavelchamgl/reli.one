import { useState } from "react";
import styles from "./SellerStatistics.module.scss";

const SellerStatistics = () => {
  const [tab, setTabs] = useState("curr");

  return (
    <div className={styles.main}>
      <div className={styles.tabsDiv}>
        <button
          onClick={() => setTabs("curr")}
          className={tab === "curr" ? styles.btnAc : styles.btn}
        >
          In currency
        </button>
        <button
          onClick={() => setTabs("pie")}
          className={tab === "pie" ? styles.btnAc : styles.btn}
        >
          In pieces
        </button>
      </div>

      <div className={styles.staticsWrap}>
        <div className={`${styles.statics} ${styles.orderStatic}`}>
          <div>
            <h4>Ordered:</h4>
            <span>as of 7.12.2024</span>
          </div>
          <p>130 pcs.</p>
        </div>
        <div className={`${styles.statics} ${styles.deliveredStatic}`}>
          <div>
            <h4>Shipped:</h4>
            <span>as of 7.12.2024</span>
          </div>
          <p>77 pcs.</p>
        </div>
      </div>
    </div>
  );
};

export default SellerStatistics;
