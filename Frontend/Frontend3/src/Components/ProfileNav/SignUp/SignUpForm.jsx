import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";

import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./SignUpForm.module.scss";

const SignUpForm = () => {
  const [size, setSize] = useState("352px");
  const isMobile = useMediaQuery({ maxWidth: 400 });

  useEffect(() => {
    if (isMobile) {
      setSize("286px");
    } else {
      setSize("352px");
    }
  }, [isMobile]);

  return (
    <div className={styles.main}>
      <h3 className={styles.title}>Zaregistrujte se zde</h3>
      <label className={styles.inpLabel}>
        <span>Jméno a příjmení*</span>
        <AuthInp type={"text"} width={size} />
      </label>
      <label className={styles.inpLabel}>
        <span>Еmail*</span>
        <AuthInp type={"text"} width={size} />
      </label>
      <label className={styles.inpLabel}>
        <span>Telefon* </span>
        <AuthInp type={"text"} width={size} />
      </label>
      <label className={styles.checkDiv}>
        <CheckBox />
        <p>Souhlasíte s pravidly</p>
      </label>
      <button className={styles.subBtn}>Zaregistrujte se</button>
    </div>
  );
};

export default SignUpForm;
