import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "../styles/PaymentEnd.module.scss";
import { useEffect } from "react";

const PaymentEnd = () => {
  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    localStorage.removeItem("selectedProducts");
    localStorage.removeItem("basket");
  }, []);

  return (
    <div className={styles.main}>
      <div className={styles.contentWrap}>
        <span className={styles.title}>{t("payment_end_title")}</span>
        <p className={styles.contentDesc}>{t("payment_end_desc")}</p>
        <div className={styles.btnDiv}>
          <button className={styles.btn} onClick={() => navigate("/")}>
            {t("home_btn")}
          </button>
          <button className={styles.btn} onClick={() => navigate("/my_orders")}>
            {t("my_orders")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentEnd;
