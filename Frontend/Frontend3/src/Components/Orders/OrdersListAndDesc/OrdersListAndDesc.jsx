import ActualOrdersCard from "../ActualOrdersCard/ActualOrdersCard";

import styles from "../ActualSeaction/ActualSection.module.scss";

const OrdersListAndDesc = () => {
  return (
    <div>
      <div>
        <ActualOrdersCard />
        <ActualOrdersCard />
        <ActualOrdersCard />
        <ActualOrdersCard />
      </div>
      <div className={styles.prodDescWrap}>
        <div className={styles.prodDescDiv}>
          <p>Mezisoučet:</p>
          <p>450.00 Kč</p>
        </div>
        <div className={styles.prodDescDiv}>
          <p>Přeprava:</p>
          <p>Zdarma</p>
        </div>
        <div className={styles.prodDescDiv}>
          <p>Propagační kód</p>
          <p style={{ color: "#047857" }}>-150.00 Kč</p>
        </div>
      </div>
      <div className={styles.totalDiv}>
        <p>Celkem</p>
        <div className={styles.priceDiv}>
          <span>CZK</span>
          <p>300.00 Kč</p>
        </div>
      </div>
    </div>
  );
};

export default OrdersListAndDesc;
