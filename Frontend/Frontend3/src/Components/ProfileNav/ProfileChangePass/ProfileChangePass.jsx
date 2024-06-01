import { useMediaQuery } from "react-responsive";
import { useState, useEffect } from "react";

import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./ProfileChangePass.module.scss";

const ProfileChangePass = () => {

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
      <h3 className={styles.title}>Změna hesla</h3>
      <label className={styles.inpLabel}>
        <span>Staré heslo</span>
        <AuthInp type={"password"} width={size} />
      </label>
      <label className={styles.inpLabel}>
        <span>Nové heslo</span>
        <AuthInp type={"password"} width={size} />
      </label>
      <label className={styles.checkDiv}>
        <CheckBox />
        <p>Potvrzení změny hesla</p>
      </label>
      <button className={styles.subBtn}>Změnit heslo</button>
    </div>
  );
};

export default ProfileChangePass;
