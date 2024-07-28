import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useActions } from "../../../hook/useAction";
import { useSelector } from "react-redux";

import arrRight from "../../../assets/Payment/arrRight.svg";
import arrRightWhite from "../../../assets/Payment/arrRightWhite.svg";

import styles from "./PaymentDeliveryInp.module.scss";

const PaymentDeliveryInp = ({ desc, title, value, setSection = null }) => {
  console.log(desc, title, value);
  const [hover, setHover] = useState(false);
  const [inpValue, setInpValue] = useState(value);

  useEffect(() => {
    setInpValue(value);
  }, [value]);

  const paymentInfo = useSelector((state) => state.payment.paymentInfo);
  const { t } = useTranslation();

  const { editValue, plusMinusDelivery } = useActions();

  const handleClick = () => {
    console.log(inpValue);

    if (desc === "email") {
      editValue({ email: inpValue });
    }

    if (desc === "address") {
      editValue({ address: inpValue });
    }

    if (desc === "TK") {
      if (setSection) {
        plusMinusDelivery({ type: "minus", price: paymentInfo.price });
        setSection(2);
      }
    }
  };

  return (
    <div className={styles.main}>
      <span className={styles.title}>{title}</span>
      <div className={styles.inpBtnDiv}>
        <input
          type="text"
          value={inpValue}
          onChange={(e) => setInpValue(e.target.value)}
        />
        <button
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={handleClick}
        >
          <span>{t("pay_change")}</span>
          <img src={hover ? arrRightWhite : arrRight} alt="" />
        </button>
      </div>
    </div>
  );
};

export default PaymentDeliveryInp;
