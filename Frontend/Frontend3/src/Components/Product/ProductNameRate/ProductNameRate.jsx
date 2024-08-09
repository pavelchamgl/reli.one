import { Rating } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { addToBasket } from "../../../redux/basketSlice";
import ProductDeliveryCar from "../../../assets/Product/productDeliveryCar.svg";
import addBasketCheckIcon from "../../../assets/Product/addBasketCheckIcon.svg";

import styles from "./ProductNameRate.module.scss";
import { useEffect, useState } from "react";

const ProductNameRate = () => {
  const [inBasket, setInBasket] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const { id } = useParams();

  const product = useSelector((state) => state.products.product);

  const basket = useSelector((state) => state.basket.basket);

  console.log(product);

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

  useEffect(() => {
    if (basket.some((item) => item.id === Number(id))) {
      setInBasket(true);
    } else {
      setInBasket(false);
    }
  }, [id, basket]);



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
      <p className={styles.price}>{product.price} €</p>
      <button className={styles.addBasketBtn} onClick={handleAddBasket}>
        {inBasket && <img src={addBasketCheckIcon} alt="" />}
        {t("add_basket")}
      </button>
      <button className={styles.deliveryBtn}>
        <img src={ProductDeliveryCar} alt="" />
        <p>{t("delivery_btn")}</p>
      </button>
    </div>
  );
};

export default ProductNameRate;
