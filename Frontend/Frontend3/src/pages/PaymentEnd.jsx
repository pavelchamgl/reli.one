import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "../styles/PaymentEnd.module.scss";
import { useEffect } from "react";
import { useActions } from "../hook/useAction";
import { useLocation } from "react-router-dom"
import { getDataFromSessionId } from "../api/payment";

const PaymentEnd = () => {
  const navigate = useNavigate();

  const { t } = useTranslation();

  const { search } = useLocation()

  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");

  const { paymentEndBasket, clearBasket } = useActions();

  const basket = JSON.parse(localStorage.getItem("basket") || "[]");
  const baskets = JSON.parse(localStorage.getItem("baskets") || "[]");
  const localEmail = localStorage.getItem("email");

  const otherBaskets = baskets.filter(
    (item) => item.email !== localEmail
  );

  useEffect(() => {
    let newBasket;
    if (basket && basket.length > 0) {
      newBasket = basket.filter((item) => !item.selected);
    }

    localStorage.removeItem("selectedProducts");
    localStorage.removeItem("basketTotal")
    // localStorage.setItem("basket", JSON.stringify(newBasket));
    localStorage.setItem(
      "baskets",
      JSON.stringify([
        ...otherBaskets,
        {
          email: JSON.parse(localEmail),
          basket: newBasket,
        },
      ])
    );
    paymentEndBasket();
    clearBasket()
  }, []);

  useEffect(() => {
    getDataFromSessionId(sessionId)
  }, [sessionId])

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
