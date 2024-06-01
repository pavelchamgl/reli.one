import { Rating } from "@mui/material";

import ProductDeliveryCar from "../../../assets/Product/productDeliveryCar.svg";

import styles from "./ProductNameRate.module.scss";

const ProductNameRate = () => {
  return (
    <div className={styles.main}>
      <div className={styles.ratingDiv}>
        <Rating name="read-only" value={5} readOnly />
        <p>21</p>
      </div>
      <div className={styles.nameCategoryDiv}>
        <p>SUNERGY 435w-450w</p>
        <span>solární panel</span>
      </div>
      <p className={styles.price}>300.00 Kč</p>
      <button className={styles.addBasketBtn}>Přidat do košíku</button>
      <button className={styles.deliveryBtn}>
        <img src={ProductDeliveryCar} alt="" />
        <p>Dodání od 2 dnů do 4 měsíců</p>
      </button>
    </div>
  );
};

export default ProductNameRate;
