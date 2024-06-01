import { useMediaQuery } from "react-responsive";

import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./EmailConfFrom.module.scss";
import { useEffect, useState } from "react";

const EmailConfForm = () => {
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
      <h3 className={styles.title}>Zapomenuté heslo</h3>
      <p className={styles.text}>
        Odeslání e-mailu na vaši e-mailovou adresu pro obnovení hesla
      </p>
      <label className={styles.inpLabel}>
        <span>Еmail*</span>
        <AuthInp type={"text"} width={size} />
      </label>
      <button className={styles.subBtn}>Odeslat</button>
    </div>
  );
};

export default EmailConfForm;
