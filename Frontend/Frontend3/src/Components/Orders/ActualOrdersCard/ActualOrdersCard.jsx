import testImage from "../../../assets/Product/ProductTestImage.svg";

import styles from "./ActualOrdersCard.module.scss";

const ActualOrdersCard = () => {
  return (
    <div className={styles.main}>
      <div className={styles.imageDescWrap}>
        <img className={styles.img} src={testImage} alt="" />
        <div className={styles.descDiv}>
          <p className={styles.prodName}>SUNERGY 435w-450w</p>
          <p className={styles.prodDesc}>SUN 78MD-HFS</p>
        </div>
      </div>
      <p className={styles.countPrice}>
        1 <span>x</span> <span>150.00 Kč</span>
      </p>
    </div>
  );
};

export default ActualOrdersCard;
