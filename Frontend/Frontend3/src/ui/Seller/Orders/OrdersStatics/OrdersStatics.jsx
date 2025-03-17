import styles from "./OrdersStatics.module.scss";

const OrdersStatics = ({ text, style, data }) => {
  const orderStaticsText = [
    {
      text: "Awaiting assembly",
      count: data?.awaiting_assembly ?? 0,
    },
    {
      text: "Awaiting shipment",
      count: data?.awaiting_shipment ?? 0,
    },
    {
      text: "Controversial",
      count: data?.controversial ?? 0,
    },
  ];

  return (
    <div style={{ ...style }}>
      <h3 className={styles.title}>{text}</h3>
      <div className={styles.main}>
        {orderStaticsText.map((item) => (
          <div className={styles.orderStatic}>
            <p>{item.text}</p>
            <p>{item.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersStatics;
