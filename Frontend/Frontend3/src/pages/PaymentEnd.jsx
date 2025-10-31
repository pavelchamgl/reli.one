import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "../styles/PaymentEnd.module.scss";
import { useEffect } from "react";
import { useActions } from "../hook/useAction";
import { useLocation } from "react-router-dom"
import { getDataFromSessionId } from "../api/payment";

import { trackPurchase } from "../analytics/analytics";

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

  let basketTotalFromLS = 0;
  try {
    const raw = localStorage.getItem("totalPrice");
    if (raw) {
      basketTotalFromLS = Number(raw);
    }
  } catch (e) {
    // ignore	
  }

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
    if (!sessionId) return;
    getDataFromSessionId(sessionId).then((res) => {
      // пробуем вытащить сумму и валюту из ответа бэка	
      const data = res?.data || res;
      const totalFromApi =
        data?.total ||
        data?.amount ||
        data?.price ||
        0;
      const currencyFromApi = data?.currency || "EUR";
      // если бэк не прислал сумму — берём ту, что считали из localStorage	
      const finalTotal =
        Number(totalFromApi) > 0 ? Number(totalFromApi) : basketTotalFromLS;
      // отправляем событие в GTM	
      trackPurchase(
        sessionId, // transaction_id	
        finalTotal, // value	
        currencyFromApi, // currency	
        [] // items можно будет добавить позже	
      );
    })
      .catch(() => {
        // если запрос к бэку не удался — всёравно шлём событие с тем, что есть	
        trackPurchase(
          sessionId || "order_without_session",
          basketTotalFromLS,
          "EUR",
          []
        );
      });
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
