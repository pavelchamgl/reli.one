import styles from "./PaymentInp.module.scss";

const PaymentInp = ({ title, err = null, fontNum, ...props }) => {
  return (
    <>
      <label className={err ? styles.main : styles.main}>
        <span>{title}</span>
        <input style={fontNum ? { fontFamily: "var(--ft)", caretColor: "black", } : null} type="text" {...props} />
        <p className={styles.errText}>{err}</p>
      </label>
    </>
  );
};

export default PaymentInp;
