import styles from "./OrdersStatics.module.scss";

const OrdersStatics = ({ text, style }) => {
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
    <div style={{...style}}>
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
