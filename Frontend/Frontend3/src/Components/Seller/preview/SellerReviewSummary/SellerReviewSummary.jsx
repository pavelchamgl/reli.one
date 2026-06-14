import { useMemo, useState } from "react";

import { buildSellerReviewData } from "../../../../utils/sellerProductWizard";

import styles from "./SellerReviewSummary.module.scss";

const EmptyValue = ({ children = "Not specified" }) => (
  <span className={styles.emptyValue}>{children}</span>
);

const hasDisplayValue = (value) => value !== undefined && value !== null && value !== "";

const SummaryRow = ({ label, value }) => {
  const displayValue = hasDisplayValue(value) ? value : <EmptyValue />;

  return (
    <div className={styles.summaryRow}>
      <dt>{label}</dt>
      <dd>{displayValue}</dd>
    </div>
  );
};

const Section = ({ title, children, warning }) => (
  <section className={styles.section}>
    <div className={styles.sectionHeader}>
      <h3>{title}</h3>
      {warning ? <p className={styles.warningText}>{warning}</p> : null}
    </div>
    {children}
  </section>
);

const ImageGallery = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex]?.src;

  return (
    <div className={styles.gallery}>
      {activeImage ? (
        <img className={styles.mainImage} src={activeImage} alt="Product preview" />
      ) : (
        <div className={styles.imageEmpty}>No product images added</div>
      )}
      {images.length > 1 ? (
        <div className={styles.thumbnails}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={index === activeIndex ? styles.thumbnailActive : styles.thumbnail}
              onClick={() => setActiveIndex(index)}
            >
              <img src={image.src} alt={`Product thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const AttributeList = ({ attributes, parameters }) => {
  if (!attributes.length && !parameters.length) {
    return <EmptyValue>No category attributes or legacy parameters added</EmptyValue>;
  }

  return (
    <dl className={styles.summaryGrid}>
      {attributes.map((attribute) => (
        <SummaryRow
          key={attribute.id}
          label={`${attribute.name}${attribute.isRequired ? " *" : ""}`}
          value={attribute.missingRequired ? <span className={styles.warningText}>Required value is missing</span> : attribute.display}
        />
      ))}
      {parameters.map((parameter, index) => (
        <SummaryRow key={`${parameter.name}-${index}`} label={parameter.name} value={parameter.value} />
      ))}
    </dl>
  );
};

const VariantCard = ({ variant }) => {
  const dims = variant.packageDimensions || {};

  return (
    <article className={styles.variantCard}>
      <dl className={styles.summaryGrid}>
        <SummaryRow label="Variant axis/name" value={variant.axis} />
        <SummaryRow label="Variant value" value={variant.value} />
        <SummaryRow label="Sale price" value={variant.price ? `${variant.price} €` : ""} />
        <SummaryRow label="Stock quantity" value={variant.stock ?? ""} />
        <SummaryRow label="System SKU" value={variant.sku} />
      </dl>
      <div className={styles.packageBlock}>
        <h4>Package Dimensions For Delivery</h4>
        <dl className={styles.summaryGrid}>
          <SummaryRow label="Package length, cm" value={dims.length} />
          <SummaryRow label="Package width, cm" value={dims.width} />
          <SummaryRow label="Package height, cm" value={dims.height} />
          <SummaryRow label="Package weight, kg" value={dims.weight} />
        </dl>
      </div>
    </article>
  );
};

const SellerReviewSummary = ({ product }) => {
  const review = useMemo(() => buildSellerReviewData(product), [product]);

  return (
    <div className={styles.main}>
      <section className={styles.previewArea}>
        <ImageGallery images={review.images} />
        <div className={styles.productInfo}>
          <p className={styles.previewLabel}>Seller product preview</p>
          <h2>{review.productName || "Untitled product"}</h2>
          <p className={styles.category}>{review.categoryName || "Category not selected"}</p>
          <p className={styles.price}>{review.price ? `${review.price} €` : "Price not specified"}</p>
          <div className={styles.variantPills}>
            {review.variants.length ? review.variants.map((variant) => (
              <button key={variant.id} type="button" disabled>
                {variant.value}
              </button>
            )) : <EmptyValue>No variants added</EmptyValue>}
          </div>
          <button className={styles.disabledCartButton} type="button" disabled>
            Preview only
          </button>
          {review.description ? <p className={styles.previewDescription}>{review.description}</p> : null}
        </div>
      </section>

      <Section title="Main Information">
        <dl className={styles.summaryGrid}>
          <SummaryRow label="Category" value={review.categoryName} />
          <SummaryRow label="Product name" value={review.productName} />
        </dl>
      </Section>

      <Section title="Media Files">
        {review.images.length ? (
          <div className={styles.mediaGrid}>
            {review.images.map((image, index) => (
              <figure key={image.id}>
                <img src={image.src} alt={`Product media ${index + 1}`} />
                <figcaption>{index === 0 ? "Main image" : `Additional image ${index}`}</figcaption>
              </figure>
            ))}
          </div>
        ) : <EmptyValue>No valid images added</EmptyValue>}
      </Section>

      <Section title="Description">
        <p className={styles.longText}>{review.description || <EmptyValue />}</p>
      </Section>

      <Section
        title="Category Attributes"
        warning={review.hasMissingRequiredAttributes ? "Required category attributes are missing." : null}
      >
        <AttributeList attributes={review.categoryAttributes} parameters={review.productParameters} />
      </Section>

      <Section title="Variants, Price And Stock">
        <dl className={styles.summaryGrid}>
          <SummaryRow label="VAT rate" value={review.vatRate} />
        </dl>
        <div className={styles.variantGrid}>
          {review.variants.length ? review.variants.map((variant) => (
            <VariantCard key={variant.id} variant={variant} />
          )) : <EmptyValue>No variants added</EmptyValue>}
        </div>
      </Section>

      <Section title="Documents">
        {review.documents.length ? (
          <dl className={styles.summaryGrid}>
            {review.documents.map((document) => (
              <SummaryRow key={document.id} label={document.name} value={document.status} />
            ))}
          </dl>
        ) : <EmptyValue>No license or certificate added</EmptyValue>}
      </Section>

      <Section title="Additional Seller Details">
        <dl className={styles.summaryGrid}>
          <SummaryRow label="Additional details" value={review.additionalDetails.additional_details} />
          <SummaryRow label="Country of origin" value={review.additionalDetails.country_of_origin} />
          <SummaryRow label="Warranty, months" value={review.additionalDetails.warranty_months} />
          <SummaryRow label="EAN/UPC barcode" value={review.additionalDetails.barcode} />
          <SummaryRow label="Seller article" value={review.additionalDetails.article} />
          <SummaryRow label="Age restricted" value={review.additionalDetails.is_age_restricted ? "Yes" : "No"} />
        </dl>
      </Section>
    </div>
  );
};

export default SellerReviewSummary;
