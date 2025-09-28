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
import { useDispatch, useSelector } from "react-redux";
import MobVariantDrawer from "../MobVariantDrawer/MobVariantDrawer";
import { getProductById } from "../../../api/productsApi";
import {
  addToBasket,
  deleteFromBasket,
  minusCardCount,
  plusCardCount,
} from "../../../redux/basketSlice";

const ProductCard = ({ data = null }) => {
  const [value, setValue] = useState(data ? data.rating : 0);
  const [hover, setHover] = useState(false);
  const [like, setLike] = useState(data ? data.is_favorite : false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobVarOpen, setMobVarOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [variant, setVariant] = useState(null);
  const [variants, setVariants] = useState(null);
  const [allData, setAllData] = useState(null);

  const isPlanshet = useMediaQuery({ maxWidth: 600 });
  const isMobile = useMediaQuery({ maxWidth: 426 });

  // сделай как в дизайне
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const { status, searchStatus, sellerStatus } = useSelector((state) => state.products);
  const statusFav = useSelector((state) => state.favorites.status);
  const basket = useSelector((state) => state.basket.basket);

  const handleBuy = () => {
    if (isMobile) {
      if (variants.length === 1) {
        const firstVariant = variants[0] || {};

        setVariant(firstVariant);

        const basketItem = basket.find((item) => item.sku === firstVariant.sku);
        const initialCount = basketItem ? basketItem.count + 1 : 1;

        // Обновляем сразу count и countOpen
        setCount(initialCount);
        setCountOpen(true);

        dispatch(
          addToBasket({
            id: allData.id,
            product: { ...allData, price: firstVariant.price },
            count: initialCount,
            selected: false,
            sku: firstVariant.sku || "",
            seller_id: allData.seller_id,
            price_without_vat: firstVariant.price_without_vat

          })
        );
      } else {
        setMobVarOpen(true);
      }
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
    if (!count) {
      dispatch(deleteFromBasket({ sku: variant.sku }));
      setCountOpen(false);
    }
  }, [count]);

  useEffect(() => {
    if (
      searchStatus === "loading" ||
      status === "loading" ||
      statusFav === "loading" ||
      sellerStatus === "loading"
    ) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [status, statusFav, searchStatus]);

  const handlePlus = () => {
    setCount((prev) => {
      const newCount = prev + 1;
      dispatch(plusCardCount({ sku: variant.sku, count: newCount }));
      return newCount;
    });
  };

  const handleMinus = () => {
    setCount((prev) => {
      const newCount = prev - 1;
      dispatch(minusCardCount({ sku: variant.sku, count: newCount }));
      return newCount;
    });
  };

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

  useEffect(() => {
    if (data) {
      getProductById(data.id)
        .then((res) => {
          const resData = res?.data;
          if (resData?.variants) {
            setVariants(resData.variants);
            setAllData(resData);
          }
        })
        .catch((err) => console.error("Ошибка загрузки продукта:", err));
    }
  }, [data]);

  const [formattedText, setFormattedText] = useState(data?.name || "");

  useEffect(() => {
    if (!data?.name) return;

    const replacedText = data?.name?.split(/(\d+)/).map((part, index) =>
      /\d+/.test(part) ? <span key={index}>{part}</span> : part
    );

    setFormattedText(replacedText);
  }, [data.name]);

  if (isLoading) {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonImage}></div>
        <div className={styles.skeletonDetails}>
          <div className={styles.skeletonPrice}></div>
          <div className={styles.skeletonName}></div>
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
        onClick={() => navigate(`/product/${data?.id}?name=${encodeURIComponent(data?.name || '')}`)}
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
          onClick={() => navigate(`/product/${data?.id}?name=${encodeURIComponent(data?.name || '')}`)}
        >
          {formattedText}
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
        {countOpen ? (
          <div className={styles.mobCountDiv}>
            <button onClick={handleMinus}>-</button>
            <p>{count}</p>
            <button onClick={handlePlus}>+</button>
          </div>
        ) : (
          <button onClick={handleBuy} className={styles.buyBtn}>
            {t("buy")}
          </button>
        )}
      </div>
      <BasketModal
        productData={data}
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
      />
      <MobVariantDrawer
        open={mobVarOpen}
        allData={allData}
        variants={variants}
        handleClose={() => setMobVarOpen(false)}
      />
    </div>
  );
};

export default ProductCard;
