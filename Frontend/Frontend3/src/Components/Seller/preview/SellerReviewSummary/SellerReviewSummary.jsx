import { useMemo } from "react";

import { buildSellerReviewData } from "../../../../utils/sellerProductWizard";
import SellerReviewProductLayout from "../SellerReviewProductLayout/SellerReviewProductLayout";

const SellerReviewSummary = ({ product, actionSlot }) => {
  const review = useMemo(() => buildSellerReviewData(product), [product]);

  return <SellerReviewProductLayout review={review} actionSlot={actionSlot} />;
};

export default SellerReviewSummary;
