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
import { getProductById } from "../../../api/productsApi";
import StockBadge from "../../Product/StockBadge/StockBadge";
import { isItemAvailable } from "../../../utils/stockAvailability";
import { useTranslation } from "react-i18next";

const BasketCard = ({ all, section, productData }) => {

  const [count, setCount] = useState(productData.count);
  const [checkboxValue, setCheckboxValue] = useState(productData.selected);
  const [like, setLike] = useState(
    productData ? productData.is_favorite : false
  );
  const [variants, setVariants] = useState({});
  const [isVariantOos, setIsVariantOos] = useState(false);

  const { product } = productData;

  const navigate = useNavigate();
  const { t } = useTranslation();

  const { plusCardCount, minusCardCount, updateProductPrice } = useActions();

  const dispatch = useDispatch();

  const isMobile = useMediaQuery({ maxWidth: 700 });

  const handleMinus = () => {
    setCount((prev) => {
      const newCount = prev > 1 ? prev - 1 : prev;
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



  const handleDelete = () => {
    if (section === "payment") {
      dispatch(
        selectProduct({
          sku: productData.sku,
          selected: false
        })
      )
    } else {
      dispatch(deleteFromBasket({ sku: productData.sku }));
    }

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
      const ourVariant = product.variants.find(
        (item) => item.sku === productData.sku
      );
      if (ourVariant) {
        setVariants(ourVariant);
      } else {
        console.error("Variant not found for sku:", productData.sku);
      }
    }
  }, [product?.variants, productData.sku, productData]);

  useEffect(() => {
    if (!productData?.id) return;

    getProductById(productData.id).then((res) => {
      if (res.status !== 200) return;

      const data = res.data;
      const variant = data?.variants?.find(
        (item) => item?.sku === productData?.sku
      );

      if (!variant) return;

      if (variant.price !== product?.price) {
        updateProductPrice({
          data,
          sku: productData.sku,
          price: variant.price,
        });
      }

      const oos =
        typeof variant.is_available === "boolean"
          ? !variant.is_available
          : variant.stock_status === "out_of_stock";

      if (oos) {
        setIsVariantOos(true);
        if (productData.selected) {
          dispatch(selectProduct({ sku: productData.sku, selected: false }));
          setCheckboxValue(false);
        }
      }
    });
  }, [productData?.id, productData?.sku]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={styles.main}
      style={{
        ...(section === "payment" ? { width: "100%" } : {}),
        ...(isVariantOos ? { opacity: 0.6 } : {}),
      }}
    >
      {section === "basket" && (
        <div className={styles.cardChecked}>
          <Checkbox
            checked={checkboxValue}
            onChange={handleCheckboxChange}
            color="success"
            disabled={isVariantOos}
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
                {!variants.image && variants.text ? (
                  <p className={styles.descText}>
                    <span>{variants?.name + ":"}</span>
                    {variants?.text}
                  </p>
                ) : null}
              </p>
              {isVariantOos && (
                <StockBadge stockStatus="out_of_stock" />
              )}
            </div>
            <div className={styles.countDiv}>
              <button onClick={handleMinus} disabled={isVariantOos}>
                <img src={minusIcon} alt="" />
              </button>
              <p>{count}</p>
              <button onClick={handlePlus} disabled={isVariantOos}>
                <img src={plusIcon} alt="" />
              </button>
            </div>
            <div className={styles.priceDiv}>
              <p>
                {((Number(variants?.price) || Number(product?.price) || 0) * count).toFixed(2)}
                €
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.imageTextWrap}>
            <img
              className={styles.img}
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
              </h3>
              {!variants.image && variants.text ? (
                <p className={styles.descText}>
                  <span>{variants?.name + ":"}</span>
                  {variants?.text}
                </p>
              ) : null}
              {isVariantOos && (
                <StockBadge stockStatus="out_of_stock" />
              )}
            </div>
          </div>

          <div className={styles.countDiv}>
            <button onClick={handleMinus} disabled={isVariantOos}>-</button>
            <p>{count}</p>
            <button onClick={handlePlus} disabled={isVariantOos}>+</button>
          </div>

          <div className={styles.priceDiv}>
            <p>
              {
                ((Number(variants?.price) || Number(product?.price) || 0) * count).toFixed(2)
              }
              €
            </p>
            {/* <span>{product.price} Kč</span> */}
          </div>
        </>
      )}

      <div className={styles.deleteLikeDiv}>
        <button onClick={handleToggleLike}>
          <img src={like ? likeIconAcc : likeIcon} alt="" />
        </button>
        <button onClick={handleDelete}>
          <img src={deleteIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default BasketCard;
