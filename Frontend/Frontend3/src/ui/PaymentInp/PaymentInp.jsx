import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import styles from "./PaymentInp.module.scss";
import {
  isValidPhone,
  isValidZipCode,
} from "../../code/validation/validationPayment";

const PaymentInp = ({ title, err = null, fontNum, ...props }) => {
  const [error, setError] = useState(err);
  const { country } = useSelector((state) => state.payment);

  useEffect(() => {
    if (props.name === "zip") {
      const isValid = isValidZipCode(country, props.value);
      setError(isValid ? "" : "Please enter a valid zip code.");
    } else if (props.name === "phone") {
      const isValid = isValidPhone(props.value, country);
      setError(isValid ? "" : "Please enter a valid phone number.");
    } else {
      setError(err)
    }
  }, [props.value, country, err]); // добавили props.value

  return (
    <label className={styles.main}>
      <span>{title}</span>
      <input
        style={
          fontNum
            ? { fontFamily: "var(--ft)", caretColor: "black" }
            : undefined
        }
        type="text"
        {...props}
      />
      {error && <p className={styles.errText}>{error}</p>}
    </label>
  );
};

export default PaymentInp;
