import arrRight from "../../../assets/Basket/arrRight.svg";

import styles from "./BasketTotalBlock.module.scss";

const BasketTotalBlock = () => {
  return (
    <div className={styles.main}>
      <div className={styles.mainContent}>
        <div className={styles.inpDiv}>
          <input type="text" />
          <button>
            <span>Použít</span>
            <img src={arrRight} alt="" />
          </button>
        </div>
        <div className={styles.textDiv}>
          <div className={styles.priceDiv}>
            <span>Mezisoučet:</span>
            <p>150.00 Kč</p>
          </div>
          <div className={styles.calculateDiv}>
            <span>Přeprava</span>

            <span>Vypočítáno v dalším kroku</span>
          </div>
        </div>
        <div className={styles.totalDiv}>
          <p>Celkem</p>
          <div>
            <span>CZK</span>
            <strong>150.00 Kč</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketTotalBlock;
