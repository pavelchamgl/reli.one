import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import mobReturnIcon from "../../../../assets/mobileIcons/mobReturnIcon.svg";
import likeIcon from "../../../../assets/Product/like.svg";
import likeAccIcon from "../../../../assets/Product/likeAcc.svg";
import prodDelivery from "../../../../assets/Product/productDeliveryCar.svg";
import addBasketCheckIcon from "../../../../assets/Product/addBasketCheckIcon.svg";
import MobileProdSwiper from "../../../MobileProdSlice/MobileProdSlice";
import PreviewCharack from "../previewCharack/PreviewCharack";

import styles from "./PreviewImageAndName.module.scss";

const PreviewImageAndName = ({ product }) => {
  const [like, setLike] = useState(false);

  const { t } = useTranslation();

  const navigate = useNavigate()

  return (
    <div className={styles.main}>
      <div className={styles.buttonWrap}>
        <button onClick={() => navigate(-1)}>
          <img src={mobReturnIcon} alt="" />
        </button>
        <button onClick={() => setLike(!like)}>
          <img src={like ? likeAccIcon : likeIcon} alt="" />
        </button>
      </div>
      <MobileProdSwiper imageProps={product?.images} />
      <div className={styles.descAndBtnWrap}>
        <p className={styles.title}>{product?.name}</p>
        <PreviewCharack variants={product?.variantsMain} />
        <div className={styles.priceWrap}>
          <p>{product?.price} €</p>
          {/* <span>400.00 Kč</span> */}
        </div>
        <button className={styles.basketBtn}>
          <img src={addBasketCheckIcon} alt="" />
          {t("add_basket")}
        </button>
        <button className={styles.deliveryBtn}>
          <img src={prodDelivery} alt="" />
          <p>{t("delivery_btn")}</p>
        </button>
      </div>
    </div>
  );
};

export default PreviewImageAndName;
