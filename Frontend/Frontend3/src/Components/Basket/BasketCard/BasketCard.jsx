import { useState } from "react";

import testImage from "../../../assets/Product/ProductTestImage.svg";
import deleteIcon from "../../../assets/Basket/deleteIcon.svg";
import likeIcon from "../../../assets/Basket/likeIcon.svg";
import plusIcon from "../../../assets/Basket/plusIcon.svg";
import minusIcon from "../../../assets/Basket/minusIcon.svg";

import styles from "./BasketCard.module.scss";
import CheckBox from "../../../ui/CheckBox/CheckBox";

const BasketCard = ({ all, section }) => {
  const [count, setCount] = useState(0);

  const handleMinus = () => {
    if (!count) {
      setCount(count);
    } else {
      setCount((prev) => prev - 1);
    }
  };

  return (
    <div className={styles.main}>
      {section === "basket" && (
        <div className={styles.cardChecked}>
          <CheckBox check={all} />
        </div>
      )}
      <div className={styles.imageTextWrap}>
        <img className={styles.img} src={testImage} alt="" />
        <div className={styles.textDiv}>
          <h3>SUNERGY 435w-450w</h3>
          <p>SUN 78MD-HFS</p>
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
        <p>150.00 Kč</p>
        <span>300.00 Kč</span>
      </div>

      <div className={styles.deleteLikeDiv}>
        <button>
          <img src={likeIcon} alt="" />
        </button>
        <button>
          <img src={deleteIcon} alt="" />
        </button>
      </div>
    </div>
  );
};

export default BasketCard;
