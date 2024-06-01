import { Rating } from "@mui/material";

import styles from "./ProductCommentItem.module.scss";

const ProductCommentItem = ({ url }) => {
  return (
    <div className={styles.main}>
      <Rating value={5} readOnly />
      <div className={styles.commentDiv}>
        <p className={styles.boldText}>Dastan</p>
        <p className={styles.lightText}>20. srpna 2023</p>
        <p className={styles.boldText}>Skvělá kvalita</p>
        {url && <img src={url} alt="" />}
      </div>
    </div>
  );
};

export default ProductCommentItem;
