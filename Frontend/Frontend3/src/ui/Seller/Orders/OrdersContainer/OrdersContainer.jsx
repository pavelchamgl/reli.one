import styles from "./OrdersContainer.module.scss";

const OrdersContainer = ({ children }) => {
  return <div className={styles.main}>{children}</div>;
};

export default OrdersContainer;
