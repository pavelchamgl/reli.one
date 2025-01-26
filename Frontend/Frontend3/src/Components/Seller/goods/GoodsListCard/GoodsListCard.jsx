import { Rating } from "@mui/material";
import { useState } from "react";

import testImg from "../../../../assets/Product/ProductTestImage.svg";

import styles from "./GoodsListCard.module.scss";
import GoodsDeleteModal from "../../../../ui/Seller/Goods/GoodsDeleteModal/GoodsDeleteModal";

const GoodsListCard = () => {
  const [open, setOpen] = useState(false);

  const isLoading = false

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
    <>
      <div className={styles.main}>
        <div className={styles.imageDiv}>
          <img src={testImg} alt="" />
        </div>
        <div className={styles.priceDiv}>
          <p>150€</p>
          <span>120€</span>
        </div>
        <p className={styles.name}>Robot Vysavač Dyson LXS10 White</p>
        <div className={styles.rateDiv}>
          <Rating name="read-only" size="small" value={5} readOnly />
          <span className={styles.rateText}>5</span>
        </div>
        <p className={styles.orderCountText}>Ordered: 153521</p>
        <div className={styles.btnsDiv}>
          <button>Edit</button>
          <button onClick={() => setOpen(!open)}>Del</button>
        </div>
      </div>
      <GoodsDeleteModal open={open} handleClose={() => setOpen(!open)} />
    </>
  );
};

export default GoodsListCard;
