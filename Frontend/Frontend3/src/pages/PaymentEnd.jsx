import styles from "../styles/PaymentEnd.module.scss";

const PaymentEnd = () => {
  return (
    <div className={styles.main}>
      <div className={styles.contentWrap}>
        <span className={styles.title}>
          Vaše objednávka byla úspěšně zadána!
        </span>
        <p className={styles.contentDesc}>
          Vaše objednávka №1210031 úspěšně vytvořena od 16:08 12.08.2023. Na
          vaši e-mailovou adresu bude zaslán e-mail s informacemi o objednávce
        </p>
        <div className={styles.btnDiv}>
          <button className={styles.btn}>Domů</button>
          <button className={styles.btn}>Moje objednávky</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentEnd;
