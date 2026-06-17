import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import SellerReviewDetailsSections from "./SellerReviewDetailsSections";
import SellerReviewGallery from "./SellerReviewGallery";
import SellerReviewProductInfo from "./SellerReviewProductInfo";
import { translateCategoryName } from "../../../../utils/sellerCatalogI18n";

import styles from "./SellerReviewProductLayout.module.scss";

const SellerReviewProductLayout = ({ review, actionSlot }) => {
  const { t } = useTranslation("translation");
  const productName = review.productName || "Untitled product";
  const categoryName = translateCategoryName(review.categoryId, review.categoryName, t) || "Category not selected";
  const [activeVariantId, setActiveVariantId] = useState(review.variants[0]?.id ?? null);

  useEffect(() => {
    setActiveVariantId(review.variants[0]?.id ?? null);
  }, [review.variants]);

  const activeVariant = review.variants.find((variant) => variant.id === activeVariantId) || review.variants[0];

  return (
    <article className={styles.main}>
      <section className={styles.previewBanner}>
        <span className={styles.bannerDot} aria-hidden="true" />
        <p className={styles.bannerText}>
          <strong>Preview mode.</strong>{" "}
          This is how your product will appear to buyers after approval. Review all fields carefully before submitting for moderation.
        </p>
      </section>

      <nav className={styles.breadcrumb} aria-label="Product preview breadcrumb">
        <span>Home</span>
        <span aria-hidden="true">/</span>
        <span>{categoryName}</span>
        <span aria-hidden="true">/</span>
        <span>{productName}</span>
      </nav>

      <div className={styles.productGrid}>
        <div className={styles.galleryColumn}>
          <SellerReviewGallery images={review.images} productName={productName} />
        </div>
        <div className={styles.infoColumn}>
          <SellerReviewProductInfo
            review={review}
            activeVariantId={activeVariantId}
            onActiveVariantChange={setActiveVariantId}
          />
          <SellerReviewDetailsSections review={review} activeVariant={activeVariant} />
          {actionSlot ? <div className={styles.actions}>{actionSlot}</div> : null}
        </div>
      </div>
    </article>
  );
};

export default SellerReviewProductLayout;
