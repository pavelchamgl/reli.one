import { useEffect, useState } from "react";
import closeEyeIcon from "../../assets/Input/closeEyesIcon.svg";
import openEyeIcon from "../../assets/Input/openEyesIcon.svg";

import styles from "./AuthInp.module.scss";

const AuthInp = ({ type, width, err = null, ...props }) => {
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
        className={err ? styles.textInpErr : styles.textInp}
        type="text"
        {...props}
      />
    );
  }
  if (type === "password") {
    return (
      <div
        style={{ width: width }}
        className={err ? styles.passInpErr : styles.passInp}
      >
        <input type={inpType} {...props} />
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
