import React, { useState, useEffect } from "react";
import { Rating } from "@mui/material";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ProductCardImage from "../../../assets/Product/ProductTestImage.svg";
import likeIcon from "../../../assets/Product/like.svg";
import likeAccIcon from "../../../assets/Product/likeAcc.svg";
import BasketModal from "../../Basket/BasketModal/BasketModal";

import styles from "./ProductCard.module.scss";
import { toggleFavorite } from "../../../api/favorite";
import { useSelector } from "react-redux";

const ProductCard = ({ data = null }) => {
  const [value, setValue] = useState(data ? data.rating : 0);
  const [hover, setHover] = useState(false);
  const [like, setLike] = useState(data ? data.is_favorite : false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isPlanshet = useMediaQuery({ maxWidth: 600 });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { status, searchStatus } = useSelector((state) => state.products);
  const statusFav = useSelector((state) => state.favorites.status);

  console.log(data);

  const handleBuy = () => {
    if (isPlanshet) {
      navigate(`/product/${data.id}`);
    } else {
      setModalOpen(true);
    }
  };

  useEffect(() => {
    if (data) {
      setLike(data.is_favorite); // Убедитесь, что состояние `like` обновляется при изменении `data`
      setValue(data.rating);
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (
      searchStatus === "loading" ||
      status === "loading" ||
      statusFav === "loading"
    ) {
      console.log("Loading...");
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [status, statusFav, searchStatus]);

  const handleToggleLike = async () => {
    const newLike = !like;
    setLike(newLike);
    try {
      await toggleFavorite(data.id);
    } catch (error) {
      // Обработка ошибки
      setLike(!newLike); // Вернуть предыдущее состояние в случае ошибки
    }
  };

  if (isLoading) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonImage}></div>
        <div className={styles.skeletonDetails}>
          <div className={styles.skeletonName}></div>
          <div className={styles.skeletonPrice}></div>
          <div className={styles.skeletonRate}>
            <div className={styles.skeletonRating}></div>
            <div className={styles.skeletonCount}></div>
          </div>
          <button className={styles.skeletonButton}></button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.main}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <button onClick={handleToggleLike} className={styles.likeBtn}>
          <img src={like ? likeAccIcon : likeIcon} alt="" />
        </button>
      )}
      <img
        onClick={() => navigate(`/product/${data.id}`)}
        className={styles.image}
        src={data.image}
        alt="Product"
      />
      <div className={styles.descWrap}>
        <div className={styles.priceDiv}>
          <p className={styles.price}>{data.price}€</p>
          <p className={styles.priceSale}>{data?.price_sale}</p>
        </div>
        <p
          className={styles.prodName}
          onClick={() => navigate(`/product/${data.id}`)}
        >
          {data.name}
        </p>
        <div className={styles.rateDiv}>
          <Rating
            size={isPlanshet ? "small" : "medium"}
            name="simple-controlled"
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
          />
          <p>{data.total_reviews}</p>
        </div>
        <button onClick={handleBuy} className={styles.buyBtn}>
          {t("buy")}
        </button>
      </div>
      <BasketModal
        productData={data}
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default ProductCard;
