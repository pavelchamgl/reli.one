import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { openSellerDocumentUrl } from "../../../../utils/sellerProductWizard";
import {
    translateCategoryAttributeName,
    translateCategoryAttributeOption,
} from "../../../../utils/sellerCatalogI18n";

import styles from "./SellerReviewProductLayout.module.scss";

export const LISTING_INFORMATION_TITLE = "Listing Information";

const LISTING_INFO_ROWS = [
  { key: "country_of_origin", label: "Country of origin", field: "country_of_origin" },
  { key: "warranty_months", label: "Warranty, months", field: "warranty_months" },
  {
    key: "age_restricted",
    label: "Age restricted",
    getValue: (details) => (details.is_age_restricted ? "Yes" : ""),
  },
];

const hasDisplayValue = (value) => value !== undefined && value !== null && value !== "";

const EmptyValue = ({ children = "Not specified" }) => (
  <span className={styles.emptyValue}>{children}</span>
);

const BlackHeaderSection = ({ title, children }) => (
  <section className={styles.blackHeaderSection}>
    <div className={styles.blackHeader}>{title}</div>
    {children}
  </section>
);

const StripedTable = ({ rows, emptyText = "No data added" }) => {
  const visibleRows = rows.filter((row) => hasDisplayValue(row.value) || row.alwaysShow);

  if (!visibleRows.length) return <EmptyValue>{emptyText}</EmptyValue>;

  return (
    <dl className={styles.stripedTable}>
      {visibleRows.map((row, index) => (
        <div
          className={`${styles.stripedRow} ${index % 2 === 1 ? styles.stripedRowAlt : ""}`}
          key={row.key || row.label}
        >
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
};

const PackageDimensionsSection = ({ activeVariant }) => {
  if (!activeVariant) return null;

  const dims = activeVariant.packageDimensions || {};
  const hasDimensions = hasDisplayValue(dims.length)
    || hasDisplayValue(dims.width)
    || hasDisplayValue(dims.height)
    || hasDisplayValue(dims.weight);

  if (!hasDimensions) return null;

  return (
    <BlackHeaderSection title="Package Dimensions For Delivery">
      <p className={styles.packageVariantLabel}>{activeVariant.value || "Default"}</p>
      <StripedTable
        rows={[
          { label: "Package length, cm", value: dims.length },
          { label: "Package width, cm", value: dims.width },
          { label: "Package height, cm", value: dims.height },
          { label: "Package weight, kg", value: dims.weight },
        ]}
        emptyText="No package dimensions added"
      />
    </BlackHeaderSection>
  );
};

const DocumentSentence = ({ documents }) => {
  const document = documents[0];

  if (!document?.url) {
    return <EmptyValue>No license or certificate added</EmptyValue>;
  }

  const handleOpenDocument = (event) => {
    event.preventDefault();
    openSellerDocumentUrl(document.url);
  };

  return (
    <p className={styles.documentSentence}>
      You can read the certificate{" "}
      <a
        href={document.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpenDocument}
      >
        here
      </a>
    </p>
  );
};

const buildCharacteristicRows = (review, t) => [
  ...review.categoryAttributes.map((attribute) => ({
    key: `attribute-${attribute.id}`,
    label: translateCategoryAttributeName(attribute.code, attribute.name, t),
    value: attribute.missingRequired
      ? <span className={styles.warningText}>Required value is missing</span>
      : attribute.dataType === "enum" && attribute.optionValue
        ? translateCategoryAttributeOption(attribute.code, {
            value: attribute.optionValue,
            label: attribute.display,
          }, t)
        : attribute.display,
    alwaysShow: attribute.missingRequired,
  })),
  ...review.productParameters.map((parameter, index) => ({
    key: `parameter-${parameter.id || parameter.name || index}`,
    label: parameter.name,
    value: parameter.value,
    alwaysShow: false,
  })),
];

const SellerReviewDetailsSections = ({ review, activeVariant }) => {
  const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState(false);
  const { t } = useTranslation(["sellerHome", "translation"]);
  const additionalDetailsText = review.additionalDetails?.additional_details || "";
  const characteristicRows = buildCharacteristicRows(review, t);

  const listingInfoRows = LISTING_INFO_ROWS.map((row) => ({
    key: row.key,
    label: row.label,
    value: row.getValue
      ? row.getValue(review.additionalDetails)
      : review.additionalDetails[row.field],
  }));

  return (
    <div className={styles.details}>
      <div className={styles.tabsRow} aria-label="Product details sections">
        <span className={styles.tabActive}>Description</span>
        <span className={styles.tabMuted} aria-hidden="true">Reviews</span>
      </div>

      <p className={styles.descriptionText}>{review.description || <EmptyValue />}</p>

      <div className={styles.additionalDetailsAccordion}>
        <button
          className={styles.additionalDetailsToggle}
          type="button"
          onClick={() => setAdditionalDetailsOpen((open) => !open)}
          aria-expanded={additionalDetailsOpen}
        >
          Additional details
          <ChevronDown
            size={18}
            className={additionalDetailsOpen ? styles.chevronOpen : ""}
            aria-hidden="true"
          />
        </button>
        {additionalDetailsOpen && additionalDetailsText ? (
          <p className={styles.additionalDetailsContent}>{additionalDetailsText}</p>
        ) : null}
      </div>

      <BlackHeaderSection title="Parameters / Characteristics">
        {review.hasMissingRequiredAttributes ? (
          <p className={styles.sectionWarning}>Required category attributes are missing.</p>
        ) : null}
        <StripedTable rows={characteristicRows} emptyText="No category attributes or legacy parameters added" />
      </BlackHeaderSection>

      <BlackHeaderSection title={LISTING_INFORMATION_TITLE}>
        <StripedTable rows={listingInfoRows} emptyText="No listing information added" />
      </BlackHeaderSection>

      <PackageDimensionsSection activeVariant={activeVariant} />

      <BlackHeaderSection title="Documents">
        <DocumentSentence documents={review.documents} />
      </BlackHeaderSection>
    </div>
  );
};

export { LISTING_INFO_ROWS };
export default SellerReviewDetailsSections;
