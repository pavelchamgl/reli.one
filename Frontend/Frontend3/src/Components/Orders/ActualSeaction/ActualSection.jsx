import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useActions } from "../../../hook/useAction";

import ActualOrdersCard from "../ActualOrdersCard/ActualOrdersCard";
import OrderSchedule from "../OrderSchedule/OrderSchedule";
import OrdersListAndDesc from "../OrdersListAndDesc/OrdersListAndDesc";
import refreshImg from "../../../assets/Search/refreshImage.svg";

import styles from "./ActualSection.module.scss";

const ActualSection = () => {
  const { t } = useTranslation();

  const { fetchGetDetalOrders } = useActions();

  useEffect(() => {
    fetchGetDetalOrders();
  }, []);

  const { order } = useSelector((state) => state.orders);

  console.log(order);

  if (Object.keys(order).length > 0) {
    return (
      <div className={styles.main}>
        <p className={styles.prodNumber}>
          {t("order")} <span>№{order?.order_number}</span>
        </p>
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
  } else {
    return (
      <div className={styles.noContentWrap}>
        <img src={refreshImg} alt="" />
        <p>{t("noContent.title")}</p>
        <p>{t("noContent.desc")}</p>
      </div>
    );
  }
};

export default ActualSection;
