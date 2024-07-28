import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useActions } from "../../../hook/useAction";

import OrdersListAndDesc from "../OrdersListAndDesc/OrdersListAndDesc";
import arrTop from "../../../assets/Order/arrTop.svg";
import HistorySmallCard from "../HistorySmallCard/HistorySmallCard";

import styles from "./HistorySection.module.scss";
import NoContentText from "../../../ui/NoContentText/NoContentText";
import Loader from "../../../ui/Loader/Loader";

const HistorySection = () => {
  const [small, setSmall] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const { t } = useTranslation();

  const { fetchGetOrders, fetchGetDetalOrders } = useActions();

  const { orders, order, ordersStatus, orderStatus } = useSelector(
    (state) => state.orders
  );

  useEffect(() => {
    fetchGetOrders();
  }, [fetchGetOrders]);

  useEffect(() => {
    if (small && orderId) {
      fetchGetDetalOrders(orderId);
    }
  }, [small, orderId, fetchGetDetalOrders]);

  if (small) {
    if (orderStatus === "loading") {
      return (
        <div className={styles.loaderWrap}>
          <Loader />
        </div>
      );
    } else {
      return (
        <div className={styles.main}>
          <div>
            <div className={styles.buttonDiv}>
              <p className={styles.prodNumber}>
                {t("order")} <span>№{order?.order_number}</span>
              </p>
              <button onClick={() => setSmall(false)}>
                <img src={arrTop} alt="" />
              </button>
            </div>
            <div className={styles.timeTextWrap}>
              <p className={styles.prodNumber}>
                {t("order_time")}: <span>{order?.order_date}</span>
              </p>
            </div>
          </div>
          <OrdersListAndDesc />
        </div>
      );
    }
  } else {
    if (ordersStatus === "loading") {
      return <Loader />;
    } else {
      return (
        <div className={styles.smallCardDiv}>
          {orders && orders.length > 0 ? (
            orders.map((item) => (
              <div
                key={item.id} // Добавлен ключ для уникальности элемента
                onClick={() => {
                  setOrderId(item.id);
                }}
                className={styles.main}
              >
                <HistorySmallCard item={item} setSmall={setSmall}/>
              </div>
            ))
          ) : (
            <NoContentText />
          )}
        </div>
      );
    }
  }
};

export default HistorySection;
