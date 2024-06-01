import { useState } from "react";
import arrRight from "../../../assets/Payment/arrRight.svg";
import arrRightWhite from "../../../assets/Payment/arrRightWhite.svg";

import styles from "./PaymentDeliveryInp.module.scss";

const PaymentDeliveryInp = ({ title }) => {
  const [hover, setHover] = useState(false);

  return (
    <div className={styles.main}>
      <span className={styles.title}>{title}</span>
      <div className={styles.inpBtnDiv}>
        <input type="text" />
        <button
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <span>Změna</span>
          <img src={hover ? arrRightWhite : arrRight} alt="" />
        </button>
      </div>
    </div>
  );
};

export default PaymentDeliveryInp;
