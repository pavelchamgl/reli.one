import { Rating } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import testImg from "../../../../assets/Product/ProductTestImage.svg";
import GoodsDeleteModal from "../../../../ui/Seller/Goods/GoodsDeleteModal/GoodsDeleteModal";

import styles from "./GoodsListCard.module.scss";

const GoodsListCard = ({ item, isLoading }) => {
  const navigate = useNavigate()

  const [open, setOpen] = useState(false);


  console.log(item);



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
          <img src={item?.image} alt="" />
        </div>
        <div className={styles.priceDiv}>
          {item ? <p>{`${item?.price}€`}</p> : <></>}
          {/* <span>120€</span> */}
        </div>
        <p className={styles.name}>{item?.name}</p>
        <div className={styles.rateDiv}>
          <Rating name="read-only" size="small" value={item ? item?.rating : 0} readOnly />
          <span className={styles.rateText}>{item ? item?.rating : 0}</span>
        </div>
        <p className={styles.orderCountText}>Ordered: {item && item?.ordered_count ? item?.ordered_count : 0}</p>
        <div className={styles.btnsDiv}>
          <button onClick={()=> navigate(`/seller/seller-edit/${item?.id}`)}>Edit</button>
          <button onClick={() => setOpen(!open)}>Del</button>
        </div>
      </div>
      <GoodsDeleteModal open={open} handleClose={() => setOpen(!open)} />
    </>
  );
};

export default GoodsListCard;
