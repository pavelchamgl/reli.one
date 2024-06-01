import { Rating } from "@mui/material";
import { useState } from "react";

import ProductCommentItem from "../ProductCommentItem/ProductCommentItem";
import ProductCommentSlide from "../ProductCommentSlide/ProductCommentSlide";
import ProductCommentForm from "../ProductCommentForm/ProductCommentForm";

import styles from "./ProductComments.module.scss";

const ProductComments = () => {
  const [openForm, setOpenForm] = useState(false);

  return (
    <div className={styles.main}>
      {openForm && (
        <ProductCommentForm open={openForm} handleClose={() => setOpenForm(!openForm)} />
      )}
      <ProductCommentSlide />
      <div className={styles.prodRate}>
        <p>5</p>
        <Rating value={5} readOnly />
        <p>21</p>
      </div>
      <button
        onClick={() => setOpenForm(!openForm)}
        className={styles.writeBtn}
      >
        Napsat recenzi
      </button>
      <div className={styles.commentWrap}>
        <ProductCommentItem
          url={
            "https://i.pinimg.com/564x/1d/5d/df/1d5ddfd9de61ee3b8d050681a37c698d.jpg"
          }
        />
        <ProductCommentItem />
        <ProductCommentItem />
      </div>
    </div>
  );
};

export default ProductComments;
