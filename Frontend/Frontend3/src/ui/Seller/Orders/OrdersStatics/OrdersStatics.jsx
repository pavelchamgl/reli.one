import styles from "./OrdersStatics.module.scss";

const OrdersStatics = () => {
  const orderStaticsText = [
    {
      text: "Awaiting assembly",
      count: 0,
    },
    {
      text: "Awaiting shipment",
      count: 0,
    },
    {
      text: "Controversial",
      count: 0,
    },
  ];

  return (
    <div className={styles.main}>
      {orderStaticsText.map((item) => (
        <div className={styles.orderStatic}>
          <p>{item.text}</p>
          <p>{item.count}</p>
        </div>
      ))}
    </div>
  );
};

export default OrdersStatics;
