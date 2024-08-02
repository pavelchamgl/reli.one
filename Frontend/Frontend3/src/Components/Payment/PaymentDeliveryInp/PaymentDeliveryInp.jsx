import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useActions } from "../../../hook/useAction";
import { useSelector } from "react-redux";

import arrRight from "../../../assets/Payment/arrRight.svg";
import arrRightWhite from "../../../assets/Payment/arrRightWhite.svg";

import styles from "./PaymentDeliveryInp.module.scss";

const PaymentDeliveryInp = ({ desc, title, value, setSection = null }) => {
  const [hover, setHover] = useState(false);
  const [inpValue, setInpValue] = useState(value);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    setInpValue(value);
  }, [value]);

  const { paymentInfo, delivery } = useSelector((state) => state.payment);
  const { totalCount } = useSelector((state) => state.basket);
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
      plusMinusDelivery({ type: "minus", price: paymentInfo.price });
      editValue({ TK: inpValue, price: price });
      plusMinusDelivery({ type: "plus", price: price });
      // if (setSection) {
      //   setSection(2);
      // }
    }
  };

  useEffect(() => {
    console.log(paymentInfo);
    console.log(totalCount);
  }, [totalCount, paymentInfo]);

  useEffect(() => {
    if (desc === "TK" && delivery) {
      let foundPrice = 0; // Начальное значение цены

      delivery.forEach((item) => {
        if (
          item?.TK.replace(/\s+/g, "") === inpValue.trim().replace(/\s+/g, "")
        ) {
          foundPrice = item?.price; // Обновляем цену, если условие выполняется
        }
      });

      setPrice(foundPrice); // Устанавливаем цену один раз после цикла
    }
  }, [inpValue, desc, delivery]);

  useEffect(() => {
    if (desc === "TK") {
      const normalizedValue = inpValue.trim().toLowerCase().replace(/\s+/g, "");

      const isValid =
        normalizedValue === "dpd" ||
        normalizedValue === "ppl" ||
        normalizedValue === "sclad" ||
        normalizedValue === "globallogistics";

      setError(!isValid);
      console.log("Error state:", !isValid);
    }
  }, [inpValue]);

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
          disabled={error}
        >
          <span>{t("pay_change")}</span>
          <img src={hover || error ? arrRightWhite : arrRight} alt="" />
        </button>
      </div>
      {error && (
        <p className={styles.errorText}>
          We do not have such a transport company. Available companies: DPD,
          PPL, Global logistics.
        </p>
      )}
    </div>
  );
};

export default PaymentDeliveryInp;
