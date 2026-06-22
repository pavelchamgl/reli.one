import { Rating } from "@mui/material";
import { Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getStockTranslationKey } from "../../../../utils/stockAvailability";
import { STOCK_STATUS } from "../../../../models/productStock";
import { translateCategoryName } from "../../../../utils/sellerCatalogI18n";

import styles from "./SellerReviewProductLayout.module.scss";

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") return "";
  return `${value} €`;
};

const variantHasImage = (variant) => Boolean(variant?.image);
const variantUsesImageDisplay = (variants = []) => variants.some(variantHasImage);
const isImageOnlyVariantValue = (value) => !value || value === "Image variant" || value === "Default";

const getVariantDisplayName = (variant) => {
  if (!variant) return "";
  if (variantHasImage(variant) && isImageOnlyVariantValue(variant.value)) {
    return "";
  }
  return variant.value || "Default";
};

const SellerReviewProductInfo = ({ review, activeVariantId, onActiveVariantChange }) => {
  const { t } = useTranslation(["translation", "sellerHome"]);
  const categoryLabel = translateCategoryName(review.categoryId, review.categoryName, t);

  const activeVariant = review.variants.find((variant) => variant.id === activeVariantId) || review.variants[0];
  const price = activeVariant?.price || review.price;
  const priceWithoutVat = activeVariant?.priceWithoutVat || review.priceWithoutVat;
  const variantAxisLabel = review.variantAxisName || activeVariant?.axis || "Variant";
  const showVariantImages = variantUsesImageDisplay(review.variants);
  const isOutOfStock = activeVariant?.stockStatus === STOCK_STATUS.OUT_OF_STOCK;
  const vatRateLabel = review.vatRate || "0";
  const activeVariantLabel = getVariantDisplayName(activeVariant);

  const getVariantStockLabel = (stockStatus) => {
    const translationKey = getStockTranslationKey(stockStatus);
    return translationKey ? t(translationKey).toUpperCase() : "";
  };

  return (
    <section className={styles.productInfo} aria-label="Product information">
      <div className={styles.ratingRow}>
        <Rating
          name="seller-review-rating"
          value={review.rating || 0}
          readOnly
          sx={{
            "& .MuiRating-icon": { fontFamily: "var(--ft)" },
          }}
        />
        <span className={styles.ratingCount} translate="no">{review.totalReviews}</span>
      </div>

      <div className={styles.titleBlock}>
        <h1>{review.productName || "Untitled product"}</h1>
        <span className={styles.categoryTag}>{categoryLabel || "Category not selected"}</span>
      </div>

      <div className={styles.priceBlock}>
        <p className={styles.price} translate="no">{formatCurrency(price) || "Price not specified"}</p>
        <p className={styles.withoutVat}>
          Excl. VAT (<span translate="no">{vatRateLabel}</span>%):{" "}
          <span className={styles.withoutVatValue} translate="no">
            {formatCurrency(priceWithoutVat) || "Not specified"}
          </span>
        </p>
      </div>

      <div className={styles.variantSelector}>
        <p className={styles.variantAxisLabel}>
          {variantAxisLabel}:{activeVariantLabel ? <> <strong>{activeVariantLabel}</strong></> : null}
        </p>
        <div className={showVariantImages ? styles.variantCardsWithImage : styles.variantCards}>
          {review.variants.length ? review.variants.map((variant) => {
            const isActive = variant.id === activeVariant?.id;
            const isVariantOutOfStock = variant.stockStatus === STOCK_STATUS.OUT_OF_STOCK;
            const stockLabel = getVariantStockLabel(variant.stockStatus);
            const hasImage = variantHasImage(variant);
            const variantLabel = getVariantDisplayName(variant);

            return (
              <button
                key={variant.id}
                type="button"
                className={[
                  styles.variantCard,
                  hasImage ? styles.variantCardWithImage : "",
                  isActive ? styles.variantCardActive : "",
                  isVariantOutOfStock ? styles.variantCardOutOfStock : "",
                ].filter(Boolean).join(" ")}
                onClick={() => onActiveVariantChange(variant.id)}
                aria-pressed={isActive}
                aria-label={`${variantLabel || variantAxisLabel} ${variant.price || ""} ${stockLabel}`}
              >
                {hasImage ? (
                  <span className={styles.variantCardImageWrap}>
                    <img
                      className={styles.variantCardImage}
                      src={variant.image}
                      alt={variantLabel || variantAxisLabel}
                    />
                  </span>
                ) : null}
                {variantLabel ? (
                  <span
                    className={[
                      styles.variantCardValue,
                      isVariantOutOfStock ? styles.variantCardMuted : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {variantLabel}
                  </span>
                ) : null}
                {variant.price ? (
                  <span
                    className={[
                      styles.variantCardPrice,
                      isVariantOutOfStock ? styles.variantCardMuted : "",
                    ].filter(Boolean).join(" ")}
                    translate="no"
                  >
                    {formatCurrency(variant.price)}
                  </span>
                ) : null}
                {stockLabel ? (
                  <span className={`${styles.variantCardStock} ${styles[`variantStock_${variant.stockStatus}`] || ""}`}>
                    {stockLabel}
                  </span>
                ) : null}
              </button>
            );
          }) : <span className={styles.emptyValue}>No variants added</span>}
        </div>
      </div>

      {activeVariant?.sku ? (
        <div className={styles.variantMetaLine}>
          <span>SKU: <span translate="no">{activeVariant.sku}</span></span>
        </div>
      ) : null}

      <button
        className={isOutOfStock ? styles.addToCartButtonMuted : styles.addToCartButton}
        type="button"
        disabled
        aria-disabled="true"
      >
        {isOutOfStock ? t("out_of_stock") : t("add_basket")}
      </button>

      <div className={styles.deliveryBlock}>
        <Truck size={16} aria-hidden="true" />
        <span>{review.deliveryText}</span>
      </div>
    </section>
  );
};

export default SellerReviewProductInfo;
