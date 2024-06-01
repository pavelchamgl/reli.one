import styles from "./PaymentInp.module.scss";

const PaymentInp = ({title, ...props}) => {
  return (
    <>
      <label className={styles.main}>
        <span>{title}</span>
        <input type="text" />
      </label>
    </>
  );
};

export default PaymentInp;
