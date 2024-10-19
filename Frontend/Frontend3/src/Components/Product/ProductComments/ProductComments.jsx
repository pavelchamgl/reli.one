import { Rating } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { Pagination } from "@mui/material";
import ProductCommentItem from "../ProductCommentItem/ProductCommentItem";
import ProductCommentSlide from "../ProductCommentSlide/ProductCommentSlide";
import ProductCommentForm from "../ProductCommentForm/ProductCommentForm";

import styles from "./ProductComments.module.scss";
import { useActions } from "../../../hook/useAction";

const ProductComments = () => {
  const [openForm, setOpenForm] = useState(false);
  const [page, setPage] = useState(1);

  const { t } = useTranslation();

  const { comments, count } = useSelector((state) => state.comment);
  const { product } = useSelector((state) => state.products);

  const { setCommentPage } = useActions();

  console.log(product);

  const handleChange = (event, value) => {
    setPage(value);
    setCommentPage(value);
  };

  return (
    <div className={styles.main}>
      {openForm && (
        <ProductCommentForm
          open={openForm}
          handleClose={() => setOpenForm(!openForm)}
        />
      )}
      {/* <ProductCommentSlide /> */}
      <div className={styles.prodRate}>
        <p>{product?.rating}</p>
        <Rating value={product?.rating} readOnly />
        <p>{product?.total_reviews}</p>
      </div>
      <button
        onClick={() => setOpenForm(!openForm)}
        className={styles.writeBtn}
      >
        {t("write_review")}
      </button>
      <div className={styles.commentWrap}>
        {comments.map((item) => (
          <ProductCommentItem
            // url={
            //   "https://i.pinimg.com/564x/1d/5d/df/1d5ddfd9de61ee3b8d050681a37c698d.jpg"
            // }
            item={item}
            key={item?.id}
          />
        ))}
      </div>
      <div>
        <Pagination
          shape="rounded"
          count={Math.ceil(count / 15)} // Использование Math.ceil для округления вверх
          page={page}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default ProductComments;
