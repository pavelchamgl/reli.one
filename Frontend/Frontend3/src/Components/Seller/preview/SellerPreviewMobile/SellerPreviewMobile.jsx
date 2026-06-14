import SellerReviewSummary from "../SellerReviewSummary/SellerReviewSummary";

import styles from "./SellerPreviewMobile.module.scss";

const SellerPreviewMobile = ({product}) => {
  return (
    <div className={styles.main}>
      <SellerReviewSummary product={product} />
    </div>
  );
};

export default SellerPreviewMobile;
