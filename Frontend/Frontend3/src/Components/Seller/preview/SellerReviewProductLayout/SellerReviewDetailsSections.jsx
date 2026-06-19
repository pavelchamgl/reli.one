import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { openSellerDocumentUrl } from "../../../../utils/sellerProductWizard";
import {
    translateCategoryAttributeName,
    translateCategoryAttributeOption,
} from "../../../../utils/sellerCatalogI18n";

import styles from "./SellerReviewProductLayout.module.scss";

export const LISTING_INFORMATION_TITLE_KEY = "goods.listingInformationTitle";

const LISTING_INFO_ROWS = [
  { key: "brand_name", labelKey: "goods.brand", field: "brand_name" },
  { key: "country_of_origin", labelKey: "goods.countryOfOriginLabel", field: "country_of_origin" },
  { key: "warranty_months", labelKey: "goods.warrantyMonthsLabel", field: "warranty_months" },
  { key: "age_restricted", labelKey: "goods.ageRestrictedLabel", isAgeRestricted: true },
];

const hasDisplayValue = (value) => value !== undefined && value !== null && value !== "";

const EmptyValue = ({ children }) => {
  const { t } = useTranslation("sellerHome");
  return (
    <span className={styles.emptyValue}>{children ?? t("goods.notSpecified")}</span>
  );
};

const BlackHeaderSection = ({ title, children }) => (
  <section className={styles.blackHeaderSection}>
    <div className={styles.blackHeader}>{title}</div>
    {children}
  </section>
);

const StripedTable = ({ rows, emptyText }) => {
  const { t } = useTranslation("sellerHome");
  const resolvedEmptyText = emptyText ?? t("goods.reviewNoDataAdded");
  const visibleRows = rows.filter((row) => hasDisplayValue(row.value) || row.alwaysShow);

  if (!visibleRows.length) return <EmptyValue>{resolvedEmptyText}</EmptyValue>;

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
  const { t } = useTranslation("sellerHome");

  if (!activeVariant) return null;

  const dims = activeVariant.packageDimensions || {};
  const hasDimensions = hasDisplayValue(dims.height)
    || hasDisplayValue(dims.width)
    || hasDisplayValue(dims.length)
    || hasDisplayValue(dims.weight);

  if (!hasDimensions) return null;

  return (
    <BlackHeaderSection title={t("item.packageDimensions")}>
      <p className={styles.packageVariantLabel}>{activeVariant.value || "Default"}</p>
      <StripedTable
        rows={[
          { label: t("item.packageHeightMm"), value: dims.height },
          { label: t("item.packageWidthMm"), value: dims.width },
          { label: t("item.packageLengthMm"), value: dims.length },
          { label: t("item.packageWeightKg"), value: dims.weight },
        ]}
        emptyText={t("goods.reviewNoPackageDimensions")}
      />
    </BlackHeaderSection>
  );
};

const DocumentSentence = ({ documents }) => {
  const { t } = useTranslation("sellerHome");
  const document = documents[0];

  if (!document?.url) {
    return <EmptyValue>{t("goods.reviewNoDocuments")}</EmptyValue>;
  }

  const handleOpenDocument = (event) => {
    event.preventDefault();
    openSellerDocumentUrl(document.url);
  };

  return (
    <p className={styles.documentSentence}>
      {t("goods.reviewCertificatePrefix")}{" "}
      <a
        href={document.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpenDocument}
      >
        {t("goods.reviewCertificateLink")}
      </a>
    </p>
  );
};

const buildCharacteristicRows = (review, t) => [
  ...review.categoryAttributes.map((attribute) => ({
    key: `attribute-${attribute.id}`,
    label: translateCategoryAttributeName(attribute.code, attribute.name, t),
    value: attribute.missingRequired
      ? <span className={styles.warningText}>{t("goods.reviewRequiredAttributeMissing")}</span>
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
    label: t(row.labelKey),
    value: row.isAgeRestricted
      ? (review.additionalDetails?.is_age_restricted ? t("goods.yes") : "")
      : review.additionalDetails[row.field],
  }));

  return (
    <div className={styles.details}>
      <div className={styles.tabsRow} aria-label="Product details sections">
        <span className={styles.tabActive}>{t("goods.reviewDescriptionTab")}</span>
        <span className={styles.tabMuted} aria-hidden="true">{t("goods.reviewReviewsTab")}</span>
      </div>

      <p className={styles.descriptionText}>{review.description || <EmptyValue />}</p>

      <div className={styles.additionalDetailsAccordion}>
        <button
          className={styles.additionalDetailsToggle}
          type="button"
          onClick={() => setAdditionalDetailsOpen((open) => !open)}
          aria-expanded={additionalDetailsOpen}
        >
          {t("goods.additionalSellerDetailsTitle")}
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

      <BlackHeaderSection title={t("goods.reviewParametersSectionTitle")}>
        {review.hasMissingRequiredAttributes ? (
          <p className={styles.sectionWarning}>{t("goods.reviewMissingRequiredAttributes")}</p>
        ) : null}
        <StripedTable
          rows={characteristicRows}
          emptyText={t("goods.reviewNoCharacteristics")}
        />
      </BlackHeaderSection>

      <BlackHeaderSection title={t(LISTING_INFORMATION_TITLE_KEY)}>
        <StripedTable
          rows={listingInfoRows}
          emptyText={t("goods.reviewNoListingInformation")}
        />
      </BlackHeaderSection>

      <PackageDimensionsSection activeVariant={activeVariant} />

      <BlackHeaderSection title={t("goods.documentsSectionTitle")}>
        <DocumentSentence documents={review.documents} />
      </BlackHeaderSection>
    </div>
  );
};

export { LISTING_INFO_ROWS };
export default SellerReviewDetailsSections;
