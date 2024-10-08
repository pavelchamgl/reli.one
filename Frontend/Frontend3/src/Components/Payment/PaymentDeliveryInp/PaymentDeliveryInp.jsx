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
  const [type, setType] = useState(0);
  const [curierId, setCurierId] = useState(0);
  const [error, setError] = useState(false);
  const [priceError, setPriceError] = useState(false); // Новый стейт для проверки цены

  useEffect(() => {
    setInpValue(value);
  }, [value]);

  const { paymentInfo, delivery } = useSelector((state) => state.payment);
  const { totalCount } = useSelector((state) => state.basket);
  const { t } = useTranslation();

  const { editValue, plusMinusDelivery } = useActions();

  const handleClick = () => {
    if (desc === "email") {
      editValue({ email: inpValue });
    }

    if (desc === "address") {
      editValue({ address: inpValue });
    }

    if (desc === "TK") {
      if (!priceError) {
        plusMinusDelivery({ type: "minus", price: paymentInfo.price });
        editValue({
          TK: inpValue,
          price: price,
          type: type,
          courier_id: curierId,
        });
        plusMinusDelivery({ type: "plus", price: price });
      }
    }
  };

  useEffect(() => {
    if (desc === "TK" && delivery) {
      let foundPrice = 0;
      let curId = 0;
      let deliveryType = 0;

      delivery.forEach((item) => {
        if (
          item?.TK.replace(/\s+/g, "") === inpValue.trim().replace(/\s+/g, "")
        ) {
          foundPrice = item?.price;
          curId = item?.courier_id;
          deliveryType = item?.type;
        }
      });

      setPrice(foundPrice);
      setCurierId(curId);
      setType(deliveryType);
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

      // Проверяем, является ли цена числом
      if (isValid && isNaN(price)) {
        setPriceError(true); // Если цена не является числом
      } else {
        setPriceError(false); // Если всё нормально
      }
    }
  }, [inpValue, price]);

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
          disabled={error || priceError} // Дизейблим, если есть ошибка или цена невалидна
        >
          <span>{t("pay_change")}</span>
          <img
            src={hover || error || priceError ? arrRightWhite : arrRight}
            alt=""
          />
        </button>
      </div>
      {error && (
        <p className={styles.errorText}>
          We do not have such a transport company. Available companies: DPD,
          PPL, Global logistics.
        </p>
      )}
      {priceError && (
        <p className={styles.errorText}>
          Invalid price. Unable to change delivery method.
        </p>
      )}
    </div>
  );
};

export default PaymentDeliveryInp;
