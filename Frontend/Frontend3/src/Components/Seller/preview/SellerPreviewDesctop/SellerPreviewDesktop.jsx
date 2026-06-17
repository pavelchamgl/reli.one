import SellerReviewSummary from "../SellerReviewSummary/SellerReviewSummary";

const SellerPreviewDesktop = ({ product, actionSlot }) => {
  return (
    <div>
      <SellerReviewSummary product={product} actionSlot={actionSlot} />
    </div>
  );
};

export default SellerPreviewDesktop;
