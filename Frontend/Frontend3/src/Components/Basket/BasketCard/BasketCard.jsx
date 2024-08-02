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


  const { product } = productData;

  const navigate = useNavigate();

  const { plusCardCount, minusCardCount } = useActions();

  const dispatch = useDispatch();

  const isMobile = useMediaQuery({ maxWidth: 700 });

  const handleMinus = () => {
    setCount((prev) => {
      const newCount = prev > 0 ? prev - 1 : 0;
      minusCardCount({ id: product.id, count: newCount });
      return newCount;
    });
  };
  

  const handlePlus = () => {
    setCount((prev) => {
      const newCount = prev + 1;
      plusCardCount({ id: product.id, count: newCount });
      return newCount;
    });
  };

  const handleCheckboxChange = (event) => {
    const newCheckboxValue = event.target.checked;
    setCheckboxValue(newCheckboxValue);
    dispatch(selectProduct({ id: product.id, selected: newCheckboxValue }));
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
          <img className={styles.img} src={product?.image} alt="" />
          <div className={styles.adaptiveWrap}>
            <div
              onClick={() => navigate(`/product/${product?.id}`)}
              className={styles.mobTextDiv}
            >
              <p>{product?.name}</p>
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
              <p>{product ? product.price : 0} €</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.imageTextWrap}>
            <img className={styles.img} src={product?.image} alt="" />
            <div className={styles.textDiv}>
              <h3 onClick={() => navigate(`/product/${product?.id}`)}>
                {product?.name}
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
            <p>{product?.price} €</p>
            {/* <span>{product.price} Kč</span> */}
          </div>
        </>
      )}

      <div className={styles.deleteLikeDiv}>
        <button onClick={handleToggleLike}>
          <img src={like ? likeIconAcc : likeIcon} alt="" />
        </button>
        <button onClick={() => dispatch(deleteFromBasket({ id: product.id }))}>
          <img src={deleteIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default BasketCard;
