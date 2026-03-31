import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"

import styles from "./SellerTab.module.scss";

const SellerTab = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('sellerOrder')

  return (
    <div className={styles.main}>
      <button
        className={
          pathname === "/seller/seller-home" ? styles.tabBtnAcc : styles.tabBtn
        }
        onClick={() => navigate("/seller/seller-home")}
      >
        {t('home')}
      </button>
      <button
        className={
          pathname === "/seller/goods-choice" ||
            pathname === "/seller/goods-list" ||
            pathname === "/seller/seller-preview" ||
            pathname === "/seller/seller-create"
            ? styles.tabBtnAcc
            : styles.tabBtn
        }
        onClick={() => navigate("/seller/goods-choice")}
      >
        {t("goods")}
      </button>
      <button
        className={
          pathname === "/seller/seller-order" ? styles.tabBtnAcc : styles.tabBtn
        }
        onClick={() => navigate("/seller/seller-order")}
      >
        {t('orders')}
      </button>
      <button
        className={
          pathname === "/seller/seller-order" ? styles.tabBtnAcc : styles.tabBtn
        }
        onClick={() => navigate("/seller/seller-order")}
      >
        {t('salesAnalytics')}
      </button>
    </div>
  );
};

export default SellerTab;
