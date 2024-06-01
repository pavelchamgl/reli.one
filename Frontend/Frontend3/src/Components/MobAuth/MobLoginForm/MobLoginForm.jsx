import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./MobLoginForm.module.scss";

const MobLoginForm = () => {
  return (
    <div className={styles.main}>
      <p className={styles.title}>Přihlásit se</p>
      <div className={styles.inpDiv}>
        <label className={styles.inpLabel}>
          <span>Emailová adresa</span>
          <input type="text" />
        </label>
        <label className={styles.inpLabel}>
          <div>
            <span>Heslo</span>
            <button>Zapomenuté heslo</button>
          </div>
          <input type="text" />
        </label>
      </div>
      <label className={styles.checkDiv}>
        <CheckBox />
        <span>Zůstat přihlášen</span>
      </label>
      <div className={styles.submitDiv}>
        <button>Pokračovat</button>
        <div>
          <span>Nemáte účet?</span>
          <button className={styles.regBtn}>Zaregistrujte se zde</button>
        </div>
      </div>
    </div>
  );
};

export default MobLoginForm;
