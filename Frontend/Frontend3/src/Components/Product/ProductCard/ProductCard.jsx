import { useState } from "react";
import { Rating } from "@mui/material";
import { useMediaQuery } from "react-responsive";

import ProductCardImage from "../../../assets/Product/ProductTestImage.svg";
import likeIcon from "../../../assets/Product/like.svg";
import likeAccIcon from "../../../assets/Product/likeAcc.svg";

import styles from "./ProductCard.module.scss";
import BasketModal from "../../Basket/BasketModal/BasketModal";

const ProductCard = () => {
  const [value, setValue] = useState(0);

  const [hover, setHover] = useState(false);

  const [like, setLike] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const isPlanshet = useMediaQuery({ maxWidth: 600 });

  const style = {
    backgroundImage: `url(${ProductCardImage})`,
    backgroundColor: hover ? "#F0F0F0" : "#fff",
  };

  return (
    <div
      className={styles.main}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <button onClick={() => setLike(!like)} className={styles.likeBtn}>
          <img src={like ? likeAccIcon : likeIcon} alt="" />
        </button>
      )}
      {/* <img src={ProductCardImage} alt="" /> */}
      <div className={styles.descWrap}>
        <div className={styles.priceDiv}>
          <p className={styles.price}>$300</p>
          <p className={styles.priceSale}>$310</p>
        </div>
        <p className={styles.prodName}>Robot Vysavač Dyson LXS10 White</p>

        <div className={styles.rateDiv}>
          <Rating
          size={isPlanshet ? "small" : "medium"}
            name="simple-controlled"
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
          />
          <p>21</p>
        </div>
        <button onClick={() => setModalOpen(true)} className={styles.buyBtn}>
          Koupit
        </button>
      </div>
      <BasketModal open={modalOpen} handleClose={() => setModalOpen(false)} />
    </div>
  );
};

export default ProductCard;
