import { Rating } from "@mui/material";

import styles from "./ProductCommentItem.module.scss";

const ProductCommentItem = ({ item, url }) => {
  return (
    <div className={styles.main}>
      <div className={styles.rateDiv}>
        <Rating value={item?.rating} readOnly />
        <p className={styles.lightText}>20. srpna 2023</p>
      </div>
      <div className={styles.commentDiv}>
        <p className={styles.boldText}>{item?.author}</p>
        <p className={styles.varText}>var2: blublublu</p>
        <p className={styles.boldText}>{item?.content}</p>
        {url && <img src={url} alt="" />}
      </div>
    </div>
  );
};

export default ProductCommentItem;
