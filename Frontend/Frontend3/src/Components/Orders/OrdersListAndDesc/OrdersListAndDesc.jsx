import { useTranslation } from "react-i18next";

import ActualOrdersCard from "../ActualOrdersCard/ActualOrdersCard";

import styles from "../ActualSeaction/ActualSection.module.scss";
import { useSelector } from "react-redux";

const OrdersListAndDesc = () => {
  const { t } = useTranslation();

  const { order } = useSelector((state) => state.orders);


  return (
    <div>
      <div>
        {order?.order_products?.length > 0 ? (
          order.order_products.map((item) => (
            <ActualOrdersCard key={item.id} item={item} />
          ))
        ) : (
          <div></div>
        )}

        <ActualOrdersCard />
        <ActualOrdersCard />
        <ActualOrdersCard />
      </div>
      <div className={styles.prodDescWrap}>
        <div className={styles.prodDescDiv}>
          <p>{t("subtotal")}:</p>
          <p>{order?.total_amount} €</p>
        </div>
        <div className={styles.prodDescDiv}>
          <p>{t("transportation")}:</p>
          <p>{order?.delivery_cost}</p>
        </div>
        {/* <div className={styles.prodDescDiv}>
          <p>{t("promotional_code")}</p>
          <p style={{ color: "#047857" }}>-150.00 Kč</p>
        </div> */}
      </div>
      <div className={styles.totalDiv}>
        <p>{t("total")}</p>
        <div className={styles.priceDiv}>
          <span>EUR</span>
          <p>{order?.total_amount} €</p>
        </div>
      </div>
    </div>
  );
};

export default OrdersListAndDesc;
