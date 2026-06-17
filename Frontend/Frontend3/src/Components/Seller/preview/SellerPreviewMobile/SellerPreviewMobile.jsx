import SellerReviewSummary from "../SellerReviewSummary/SellerReviewSummary";

import styles from "./SellerPreviewMobile.module.scss";

const SellerPreviewMobile = ({ product, actionSlot }) => {
  return (
    <div className={styles.main}>
      <SellerReviewSummary product={product} actionSlot={actionSlot} />
    </div>
  );
};

export default SellerPreviewMobile;
