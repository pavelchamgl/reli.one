import { useState } from "react";
import { useTranslation } from "react-i18next";

import mobReturnIcon from "../../../../assets/mobileIcons/mobReturnIcon.svg";
import likeIcon from "../../../../assets/Product/like.svg";
import likeAccIcon from "../../../../assets/Product/likeAcc.svg";
import prodDelivery from "../../../../assets/Product/productDeliveryCar.svg";
import addBasketCheckIcon from "../../../../assets/Product/addBasketCheckIcon.svg";

import styles from "./PreviewImageAndName.module.scss";
import MobileProdSwiper from "../../../MobileProdSlice/MobileProdSlice";

const PreviewImageAndName = () => {
  const [like, setLike] = useState(false);

  const { t } = useTranslation();

  const product = {
    rating: 5,
    total_reviews: 21,
    name: "Iphone",
    category_name: "Smartphone",
    price: 500,
  };

  const images = [
    {
      image_url: "",
    },
    {
      image_url: "",
    },
    {
      image_url: "",
    },
  ];

  return (
    <div className={styles.main}>
      <div className={styles.buttonWrap}>
        <button>
          <img src={mobReturnIcon} alt="" />
        </button>
        <button onClick={() => setLike(!like)}>
          <img src={like ? likeAccIcon : likeIcon} alt="" />
        </button>
      </div>
      <MobileProdSwiper imageProps={images} />
      <div className={styles.descAndBtnWrap}>
        <p className={styles.title}>{product?.name}</p>
        {/* <ProdCharackButtons
          setPrice={setEndPice}
          setSku={setSku}
          variants={product?.variants}
          id={product?.id}
        /> */}
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
