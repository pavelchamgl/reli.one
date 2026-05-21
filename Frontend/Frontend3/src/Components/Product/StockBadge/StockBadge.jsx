import { useTranslation } from "react-i18next";
import { getStockTranslationKey } from "../../../utils/stockAvailability.js";
import styles from "./StockBadge.module.scss";

const StockBadge = ({ stockStatus, className = "" }) => {
  const { t } = useTranslation();
  const translationKey = getStockTranslationKey(stockStatus);

  if (!translationKey) {
    return null;
  }

  return (
    <span
      className={`${styles.badge} ${styles[stockStatus] ?? ""} ${className}`.trim()}
      data-testid="stock-badge"
      data-stock-status={stockStatus}
    >
      {t(translationKey)}
    </span>
  );
};

export default StockBadge;
