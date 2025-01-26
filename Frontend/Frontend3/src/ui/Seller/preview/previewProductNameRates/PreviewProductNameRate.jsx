import { useTranslation } from "react-i18next";

import ProductDeliveryCar from "../../../../assets/Product/productDeliveryCar.svg";
import addBasketCheckIcon from "../../../../assets/Product/addBasketCheckIcon.svg";

import styles from "./PreviewProductNameRate.module.scss";
import { Rating } from "@mui/material";

const PreviewProductNameRate = () => {
  const { t } = useTranslation();

  const product = {
    rating: 5,
    total_reviews: 21,
    name: "Iphone",
    category_name: "Smartphone",
    price: 500,
  };

  return (
    <div className={styles.main}>
      <div className={styles.ratingDiv}>
        <Rating name="read-only" value={product.rating} readOnly />
        <p>{product.total_reviews}</p>
      </div>
      <div className={styles.nameCategoryDiv}>
        <p>{product?.name}</p>
        <span>{product?.category_name}</span>
      </div>
      <p className={styles.price}>{product?.price} €</p>
      {/* <ProdCharackButtons
        setSku={setSku}
        setPrice={setEndPice}
        variants={product?.variants}
        id={product?.id}
      /> */}
      <button className={styles.addBasketBtn}>
        <img src={addBasketCheckIcon} alt="" />
        {t("add_basket")}
      </button>
      <button className={styles.deliveryBtn}>
        <img src={ProductDeliveryCar} alt="" />
        <p>{t("delivery_btn")}</p>
      </button>
    </div>
  );
};

export default PreviewProductNameRate;
