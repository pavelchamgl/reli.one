import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import { toggleFavorite } from "../../../../api/favorite";
import mobReturnIcon from "../../../../assets/mobileIcons/mobReturnIcon.svg";
import likeIcon from "../../../../assets/Product/like.svg";
import likeAccIcon from "../../../../assets/Product/likeAcc.svg";
import prodDelivery from "../../../../assets/Product/productDeliveryCar.svg";
import MobileProdSwiper from "../../../../ui/MobileProdSlice/MobileProdSlice";

import { addToBasket } from "../../../../redux/basketSlice";

import styles from "./ProductImageAndName.module.scss";

const ProductImageAndName = () => {
  const product = useSelector((state) => state.products.product);
  console.log(product);
  const [like, setLike] = useState(product ? product.is_favorite : false);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const dispatch = useDispatch();

  const handleAddBasket = () => {
    dispatch(
      addToBasket({
        id: product.id,
        product: { ...product },
        count: 1,
        selected: false,
      })
    );
  };

  const handleLikeClick = async () => {
    const newLike = !like;
    setLike(newLike);
    try {
      await toggleFavorite(data.id);
    } catch (error) {
      // Обработка ошибки
      setLike(!newLike); // Вернуть предыдущее состояние в случае ошибки
    }
  };

  console.log(product);

  return (
    <div className={styles.main}>
      <div className={styles.buttonWrap}>
        <button onClick={() => navigate(-1)}>
          <img src={mobReturnIcon} alt="" />
        </button>
        <button onClick={handleLikeClick}>
          <img src={like ? likeAccIcon : likeIcon} alt="" />
        </button>
      </div>
      <MobileProdSwiper />
      <div className={styles.descAndBtnWrap}>
        <p className={styles.title}>{product?.name}</p>
        <div className={styles.priceWrap}>
          <p>{product?.price} €</p>
          {/* <span>400.00 Kč</span> */}
        </div>
        <button className={styles.basketBtn} onClick={handleAddBasket}>
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

export default ProductImageAndName;
