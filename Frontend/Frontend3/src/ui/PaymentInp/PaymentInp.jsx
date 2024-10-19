import styles from "./PaymentInp.module.scss";

const PaymentInp = ({ title, err = null, ...props }) => {
  return (
    <>
      <label className={err ? styles.main : styles.main}>
        <span>{title}</span>
        <input type="text" {...props} />
        <p className={styles.errText}>{err}</p>
      </label>
    </>
  );
};

export default PaymentInp;
