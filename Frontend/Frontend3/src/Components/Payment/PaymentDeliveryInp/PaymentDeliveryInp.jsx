import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useActions } from "../../../hook/useAction";


import styles from "./PaymentDeliveryInp.module.scss";


const ArrRight = () => {
  return (
    <svg width="7" height="14" viewBox="0 0 7 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-7.19052e-08 12.355L4.33019 7L-5.40054e-07 1.645L1.33962 -5.85568e-08L7 7L1.33962 14L-7.19052e-08 12.355Z" fill="currentColor" />
    </svg>
  )
}

const PaymentDeliveryInp = ({
  desc,
  title,
  value,
  setSection = null,
  city,
  street,
  groups,
  setInputError,
}) => {


  const [adressText, setAdressText] = useState(null)
  const [deliveryTypeText, setDeliveryTypeText] = useState(null)

  const { t } = useTranslation()

  const handleClick = () => {
    setSection()
  }


useEffect(() => {
  if (desc === "address" && city && street) {
    setAdressText(`${city}, ${street}`);
  }

  if (desc === "TK" && Array.isArray(groups)) {
    const types = groups
      .map((item) => item?.deliveryType)
      .filter(Boolean); // удалим undefined/null
    setDeliveryTypeText(types.join(", "));
  }
}, [city, street, groups, desc]);




  return (
    <div className={styles.main}>
      <span className={styles.title}>{title}</span>
      <div className={styles.inpBtnDiv}>
        <p>
          {
            desc === "address"
              ? adressText
              : desc === "TK"
                ? `${t("currentDeliveryMethods")}: ${deliveryTypeText}`
                : value
          }
        </p>

        <button
          onClick={handleClick}
        >
          <span>{t("pay_change")}</span>
          <ArrRight />
        </button>
      </div>
    </div>
  );
};

export default PaymentDeliveryInp;
