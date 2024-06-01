import { useState } from "react";
import closeEyeIcon from "../../assets/Input/closeEyesIcon.svg";
import openEyeIcon from "../../assets/Input/openEyesIcon.svg";

import styles from "./AuthInp.module.scss";

const AuthInp = ({ type, width, ...props }) => {
  const [inpType, setInpType] = useState("password");

  const changeType = () => {
    if (inpType === "text") {
      setInpType("password");
    } else {
      setInpType("text");
    }
  };

  if (type === "text") {
    return (
      <input
        style={{ width: width }}
        className={styles.textInp}
        type="text"
        {...props}
      />
    );
  }
  if (type === "password") {
    return (
      <div style={{ width: width }} className={styles.passInp}>
        <input type={inpType} />
        <button onClick={changeType}>
          <img
            src={inpType === "password" ? closeEyeIcon : openEyeIcon}
            alt=""
          />
        </button>
      </div>
    );
  }
};

export default AuthInp;
