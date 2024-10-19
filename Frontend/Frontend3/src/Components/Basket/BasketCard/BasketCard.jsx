import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useDispatch, useSelector } from "react-redux";
import { deleteFromBasket, selectProduct } from "../../../redux/basketSlice";
import { Checkbox } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useActions } from "../../../hook/useAction";

import { toggleFavorite } from "../../../api/favorite";
import testImage from "../../../assets/Product/ProductTestImage.svg";
import deleteIcon from "../../../assets/Basket/deleteIcon.svg";
import likeIcon from "../../../assets/Basket/likeIcon.svg";
import likeIconAcc from "../../../assets/Basket/likeAcc.svg";
import plusIcon from "../../../assets/Basket/plusIcon.svg";
import minusIcon from "../../../assets/Basket/minusIcon.svg";

import styles from "./BasketCard.module.scss";

const BasketCard = ({ all, section, productData }) => {
  const [count, setCount] = useState(productData.count);
  const [checkboxValue, setCheckboxValue] = useState(productData.selected);
  const [like, setLike] = useState(
    productData ? productData.is_favorite : false
  );
  const [variants, setVariants] = useState({});

  const { product } = productData;

  console.log(product);

  const navigate = useNavigate();

  const { plusCardCount, minusCardCount } = useActions();

  const dispatch = useDispatch();

  const isMobile = useMediaQuery({ maxWidth: 700 });

  const handleMinus = () => {
    setCount((prev) => {
      const newCount = prev > 0 ? prev - 1 : 0;
      minusCardCount({ sku: productData.sku, count: newCount });
      return newCount;
    });
  };

  const handlePlus = () => {
    setCount((prev) => {
      const newCount = prev + 1;
      plusCardCount({ sku: productData.sku, count: newCount });
      return newCount;
    });
  };

  const handleCheckboxChange = (event) => {
    const newCheckboxValue = event.target.checked;
    setCheckboxValue(newCheckboxValue);
    dispatch(
      selectProduct({ sku: productData.sku, selected: newCheckboxValue })
    );
  };

  useEffect(() => {
    setCheckboxValue(productData.selected);
  }, [productData.selected]);

  const handleToggleLike = async () => {
    const newLike = !like;
    setLike(newLike);
    try {
      await toggleFavorite(productData.id);
    } catch (error) {
      // Обработка ошибки
      setLike(!newLike); // Вернуть предыдущее состояние в случае ошибки
    }
  };

  useEffect(() => {
    if (product?.variants) {
      const ourVariant = product?.variants?.find(
        (item) => item.sku === productData.sku
      );
      setVariants(ourVariant);
    }
  }, [product?.variants, productData.sku]);

  return (
    <div className={styles.main}>
      {section === "basket" && (
        <div className={styles.cardChecked}>
          <Checkbox
            checked={checkboxValue}
            onChange={handleCheckboxChange}
            color="success"
          />
        </div>
      )}

      {isMobile ? (
        <>
          <img
            className={styles.img}
            // Если у варианта есть изображение, отображаем его
            src={
              variants.image
                ? variants.image
                : product?.image || product?.images?.[0]?.image_url
            }
            alt=""
          />
          <div className={styles.adaptiveWrap}>
            <div
              onClick={() => navigate(`/product/${product?.id}`)}
              className={styles.mobTextDiv}
            >
              <p>
                {product?.name}
                {/* Если изображения нет, добавляем текст варианта в скобках */}
                {!variants.image && variants.text ? ` (${variants.text})` : ""}
              </p>
            </div>
            <div className={styles.countDiv}>
              <button onClick={handleMinus}>
                <img src={minusIcon} alt="" />
              </button>
              <p>{count}</p>
              <button onClick={handlePlus}>
                <img src={plusIcon} alt="" />
              </button>
            </div>
            <div className={styles.priceDiv}>
              <p>{product ? Number(product.price) * count : 0} €</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.imageTextWrap}>
            <img
              className={styles.img}
              // Если у варианта есть изображение, отображаем его
              src={
                variants.image
                  ? variants.image
                  : product?.image || product?.images?.[0]?.image_url
              }
              alt=""
            />
            <div className={styles.textDiv}>
              <h3 onClick={() => navigate(`/product/${product?.id}`)}>
                {product?.name}
                {/* Если изображения нет, добавляем текст варианта в скобках */}
                {!variants.image && variants.text ? ` (${variants.text})` : ""}
              </h3>
              <p>{product?.category?.name}</p>
            </div>
          </div>

          <div className={styles.countDiv}>
            <button onClick={handleMinus}>
              <img src={minusIcon} alt="" />
            </button>
            <p>{count}</p>
            <button onClick={handlePlus}>
              <img src={plusIcon} alt="" />
            </button>
          </div>

          <div className={styles.priceDiv}>
            <p>{product ? Number(product.price) * count : 0} €</p>
            {/* <span>{product.price} Kč</span> */}
          </div>
        </>
      )}

      <div className={styles.deleteLikeDiv}>
        <button onClick={handleToggleLike}>
          <img src={like ? likeIconAcc : likeIcon} alt="" />
        </button>
        <button
          onClick={() => dispatch(deleteFromBasket({ sku: productData.sku }))}
        >
          <img src={deleteIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default BasketCard;
