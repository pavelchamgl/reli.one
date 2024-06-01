import cardImage from "../../assets/Product/ProductTestImage.svg";

import styles from "./MobCardSecond.module.scss";

const MobCardSecond = () => {
  return (
    <div className={styles.main}>
      <div className={styles.descAndImageWrap}>
        <img className={styles.img} src={cardImage} alt="" />
        <div className={styles.descDiv}>
          <p>SUNERGY 435w-450w</p>
          <span>SUN 78MD-HFS</span>
        </div>
      </div>
      <p className={styles.price}>
        1 x <strong>150.00 Kč</strong>
      </p>
    </div>
  );
};

export default MobCardSecond;
