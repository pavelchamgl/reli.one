import { useTranslation } from "react-i18next";

import ProductDeliveryCar from "../../../../assets/Product/productDeliveryCar.svg";
import addBasketCheckIcon from "../../../../assets/Product/addBasketCheckIcon.svg";

import styles from "./PreviewProductNameRate.module.scss";
import { Rating } from "@mui/material";
import PreviewCharack from "../previewCharack/PreviewCharack";

const PreviewProductNameRate = ({ product }) => {
  const { t } = useTranslation();


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
      <PreviewCharack variants={product?.variantsServ} />
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
