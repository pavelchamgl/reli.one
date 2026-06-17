import { ArrowLeft, Send } from "lucide-react";

import Spinner from "../../../../ui/Spiner/Spiner";

import styles from "./SellerReviewProductLayout.module.scss";

const SellerReviewActions = ({
  backLabel = "Back to editing",
  submitLabel = "Submit for moderation",
  isLoading = false,
  isSubmitDisabled = false,
  onBack,
  onSubmit,
}) => {
  return (
    <div className={styles.reviewActions}>
      <button className={styles.backButton} type="button" onClick={onBack}>
        <ArrowLeft size={16} />
        {backLabel}
      </button>
      <button
        className={styles.submitButton}
        type="button"
        onClick={onSubmit}
        disabled={isSubmitDisabled || isLoading}
      >
        {isLoading ? (
          <Spinner size="16px" />
        ) : (
          <>
            <Send size={15} />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  );
};

export default SellerReviewActions;
