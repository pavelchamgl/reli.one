import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToBasket,
  plusCount,
  deleteFromBasket,
} from "../../../redux/basketSlice";

import { toggleFavorite } from "../../../api/favorite";
import testImage from "../../../assets/Product/ProductTestImage.svg";
import deleteIcon from "../../../assets/Basket/deleteIcon.svg";
import likeIcon from "../../../assets/Basket/likeIcon.svg";
import likeIconAcc from "../../../assets/Basket/likeAcc.svg";
import plusIcon from "../../../assets/Basket/plusIcon.svg";
import minusIcon from "../../../assets/Basket/minusIcon.svg";

import styles from "./BasketModalCard.module.scss";

const BasketModalCard = ({ data, handleClose }) => {
  const [count, setCount] = useState(null);
  const [like, setLike] = useState(data ? data.is_favorite : false);

  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket.basket);

  const handleMinus = () => {
    if (!count) {
      setCount(count);
    } else {
      setCount((prev) => prev - 1);
    }
  };

  const handleDelete = () => {
    dispatch(deleteFromBasket({ id: data.id }));
    handleClose();
  };

  useEffect(() => {
    if (count === 1) {
      dispatch(
        addToBasket({
          id: data.id,
          product: { ...data },
          count: 1,
          selected: false,
        })
      );
    }
    if (count > 1) {
      dispatch(plusCount({ id: data.id, count: count }));
    }
  }, [count]);

  useEffect(() => {
    const ourBasketItem = basket.filter((item) => item.id === data.id);
    if (ourBasketItem.length > 0) {
      setCount(ourBasketItem[0].count);
    } else {
      setCount(0);
    }
  }, []);

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

  if (count !== null) {
    return (
      <div className={styles.main}>
        <div className={styles.imageTextWrap}>
          <img className={styles.img} src={data.image} alt="" />
          <div className={styles.textDiv}>
            <h3>{data.name}</h3>
            <p>{data.name}</p>
          </div>
        </div>

        <div className={styles.countDiv}>
          <button onClick={handleMinus}>
            <img src={minusIcon} alt="" />
          </button>
          <p>{count}</p>
          <button onClick={() => setCount(count + 1)}>
            <img src={plusIcon} alt="" />
          </button>
        </div>

        <div className={styles.priceDiv}>
          <p>{data ? Number(data.price) * count : 0} €</p>
          {/* <span>{data.price} Kč</span> */}
        </div>

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
  }
};

export default BasketModalCard;
