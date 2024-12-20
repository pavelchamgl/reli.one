import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import testImage from "../../../assets/Product/ProductTestImage.svg";

import styles from "./HistorySmallCard.module.scss";
import { useEffect, useState } from "react";

const HistorySmallCard = ({ item = null, setSmall }) => {
  const { t } = useTranslation();
  const [deliveredTime, setDeliveredTime] = useState("");
  const navigate = useNavigate();

  function formatDate(date) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  const orderDateStr = item?.order_date;
  const orderDateParts = orderDateStr.split(" ");
  const dateParts = orderDateParts[0].split(".");
  const timeParts = orderDateParts[1].split(":");

  const orderDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

  const deliveryDate = addDaysToDate(orderDate, 39); // 29 days (8 days in August + 21 days in July)

  useEffect(() => {
    setDeliveredTime(formatDate(deliveryDate));
  }, [deliveryDate]);

  return (
    <div className={styles.main}>
      <div onClick={() => setSmall(true)}>
        <div className={styles.prodNumberDiv}>
          <p className={styles.prodNumber}>
            {t("order")} <span>№{item?.order_number}</span>
          </p>
          <p className={styles.prodNumber}>
            {t("order_time")}: <span>{item?.order_date}</span>
          </p>
        </div>
        <p className={styles.delivTimeText}>{`${t(
          "delivered_on"
        )} ${deliveredTime}`}</p>
        <div className={styles.imageDiv}>
          {item?.images &&
            item?.images > 0 &&
            item.images.map((image) => <img key={image} src={image} alt="" />)}
        </div>
        <div className={styles.totalDiv}>
          <p>{t("total")}</p>
          <p>{item?.total_amount} €</p>
        </div>
      </div>
      {/* <button onClick={() => navigate(link)} className={styles.commentBtn}>
        {t("write_review")}
      </button> */}
    </div>
  );
};

export default HistorySmallCard;
