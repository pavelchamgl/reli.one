import { useEffect, useState } from "react";
import styles from "./SellerStatistics.module.scss";

const SellerStatistics = ({ data, setTabMain, grapheData }) => {
  const [tab, setTabs] = useState("curr");

  useEffect(() => {
    setTabMain(tab)
  }, [tab])



  // ordered_period: { amount: '0', count: 0 },
  //   delivered_period: { amount: '0', count: 0 },
  //   today: '2025-02-03'

  const {
    today,
    delivered_period,
    ordered_period
  } = grapheData || data || {};

  const newTodayData = today?.replace(/[-]/g, ".")

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
            <span>{`as of ${newTodayData}`}</span>
          </div>
          <p>{data && data.ordered_period && tab === "curr" ? `€ ${ordered_period?.amount}` : `${ordered_period?.count} pcs.`}</p>
        </div>
        <div className={`${styles.statics} ${styles.deliveredStatic}`}>
          <div>
            <h4>Delivered:</h4>
            <span>{`as of ${newTodayData}`}</span>
          </div>
          <p>{data && data.ordered_period && tab === "curr" ? `€ ${delivered_period?.amount}` : `${delivered_period?.count} pcs.`}</p>
        </div>
      </div>
    </div>
  );
};

export default SellerStatistics;
