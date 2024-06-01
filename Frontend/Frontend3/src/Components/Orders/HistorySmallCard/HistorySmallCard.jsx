import testImage from "../../../assets/Product/ProductTestImage.svg";

import styles from "./HistorySmallCard.module.scss";

const HistorySmallCard = () => {
  return (
    <div className={styles.main}>
      <div className={styles.prodNumberDiv}>
        <p className={styles.prodNumber}>
          Objednat <span>№123121</span>
        </p>
        <p className={styles.prodNumber}>
          Čas objednávky: <span>16:08 20.08.2023</span>
        </p>
      </div>
      <p className={styles.delivTimeText}>Doručeno 29. srpna</p>
      <div className={styles.imageDiv}>
        <img src={testImage} alt="" />
        <img src={testImage} alt="" />
        <img src={testImage} alt="" />
      </div>
      <div className={styles.totalDiv}>
        <p>Celkem</p>
        <p>300.00 Kč</p>
      </div>
      <button className={styles.commentBtn}>Napsat recenzi</button>
    </div>
  );
};

export default HistorySmallCard;
