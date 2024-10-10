import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useActions } from "../../../hook/useAction";

import ActualOrdersCard from "../ActualOrdersCard/ActualOrdersCard";
import OrderSchedule from "../OrderSchedule/OrderSchedule";
import OrdersListAndDesc from "../OrdersListAndDesc/OrdersListAndDesc";
import refreshImg from "../../../assets/Search/refreshImage.svg";
import arrTop from "../../../assets/Order/arrTop.svg";

import styles from "./ActualSection.module.scss";
import HistorySmallCard from "../HistorySmallCard/HistorySmallCard";
import NoContentText from "../../../ui/NoContentText/NoContentText";
import Loader from "../../../ui/Loader/Loader";

const ActualSection = () => {
  const [small, setSmall] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const { t } = useTranslation();

  const { fetchGetOrdersCurrent, fetchGetDetalOrders } = useActions();

  useEffect(() => {
    fetchGetOrdersCurrent();
  }, []);

  const { orders, order, ordersStatus, orderStatus } = useSelector(
    (state) => state.orders
  );

  console.log(order);

  useEffect(() => {
    if (small && orderId) {
      fetchGetDetalOrders(orderId);
    }
  }, [small, orderId, fetchGetOrdersCurrent]);

  if (small) {
    if (orderStatus === "loading") {
      return (
        <div className={styles.loaderWrap}>
          <Loader />
        </div>
      );
    } else {
      if (Object.keys(order).length > 0) {
        return (
          <div className={styles.mainWithOpen}>
            <div className={styles.buttonDiv}>
              <p className={styles.prodNumber}>
                {t("order")} <span>№{order?.order_number}</span>
              </p>
              <button onClick={() => setSmall(false)}>
                <img src={arrTop} alt="" />
              </button>
            </div>
            <div className={styles.timeTextWrap}>
              {/* <p className={styles.delivTimeText}>{t("delivery_time")}</p> */}
              <p className={styles.prodNumber}>
                {t("order_time")}: <span>{order?.order_date}</span>
              </p>
            </div>
            <OrderSchedule />
            <OrdersListAndDesc />
          </div>
        );
      }
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
                <HistorySmallCard item={item} setSmall={setSmall} />
              </div>
            ))
          ) : (
            <NoContentText />
          )}
        </div>
      );
    }
  }

  // if (Object.keys(order).length > 0) {
  //   return (
  //     <div className={styles.main}>
  //       <p className={styles.prodNumber}>
  //         {t("order")} <span>№{order?.order_number}</span>
  //       </p>
  //       <div className={styles.timeTextWrap}>
  //         {/* <p className={styles.delivTimeText}>{t("delivery_time")}</p> */}
  //         <p className={styles.prodNumber}>
  //           {t("order_time")}: <span>{order?.order_date}</span>
  //         </p>
  //       </div>
  //       <OrderSchedule />
  //       <OrdersListAndDesc />
  //     </div>
  //   );
  // } else {
  //   return (
  //     <div className={styles.noContentWrap}>
  //       <img src={refreshImg} alt="" />
  //       <p>{t("noContent.title")}</p>
  //       <p>{t("noContent.desc")}</p>
  //     </div>
  //   );
  // }
};

export default ActualSection;
