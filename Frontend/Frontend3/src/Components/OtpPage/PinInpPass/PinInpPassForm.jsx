import PinInput from "react-pin-input";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import { emailPassConfirm, passSendOtp } from "../../../api/auth";

import styles from "./PinInpPassForm.module.scss";

const PinInpPassForm = () => {
  const [time, setTime] = useState(59);
  const [regErr, setRegErr] = useState("");

  const isMobile = useMediaQuery({ maxWidth: 500 });

  const [value, setValue] = useState(0);

  const { t } = useTranslation();

  const navigate = useNavigate();

  let interval;

  useEffect(() => {
    if (time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [time]);

  const email = JSON.parse(localStorage.getItem("email"));
  const passwords = JSON.parse(localStorage.getItem("passwords"));

  const handleSubmit = () => {
    emailPassConfirm({
      email: email.email,
      otp: value,
    })
      .then((res) => {
        setRegErr("");
        localStorage.setItem("otp", value);
        navigate("/create_new_pass");
      })
      .catch((err) => {
        if (err.response) {
          if (err.response.status === 500) {
            setRegErr(
              "An error occurred on the server. Please try again later."
            );
          } else if (err.response.status === 400) {
            setRegErr("The specified OTP has expired or is invalid");
          } else if (err.response.status === 404) {
            setRegErr("User with the specified email address not found");
          } else {
            setRegErr("An unknown error occurred.");
          }
        } else {
          // Обработка случаев, когда нет ответа (например, сетевые ошибки)
          setRegErr(
            "Failed to connect to the server. Check your internet connection."
          );
        }
      });

    // navigate("/change_pass");
  };

  const handleSendAgain = () => {
    passSendOtp(email);
    setTime(59);
  };

  return (
    <div>
      <PinInput
        length={6}
        initialValue=""
        onChange={(value, index) => {
          setValue(value);
        }}
        type="numeric"
        inputMode="number"
        // style={{ padding: "16px" }}
        inputStyle={
          isMobile
            ? {
                border: "1px solid #ced4d7",
                borderRadius: "5px",
                width: "35px",
                height: "35px",
                fontWeight: "400",
                fontSize: "14px",
                color: "#191d23",
                marginRight: "10px",
              }
            : {
                border: "1px solid #ced4d7",
                borderRadius: "5px",
                width: "50px",
                height: "50px",
                fontWeight: "400",
                fontSize: "16px",
                color: "#191d23",
                marginRight: "20px",
              }
        }
        inputFocusStyle={{ borderColor: "black" }}
        regexCriteria={/^[ A-Za-z0-9_@./#&+-]*$/}
      />
      {/* <p className={styles.errText}>err</p> */}
      <div className={styles.timerDiv}>
        {time ? (
          <p>
            {t("otp_time_text")}
            {` 0:${time}`}
          </p>
        ) : (
          <button onClick={handleSendAgain}>{t("otp_send")}</button>
        )}
      </div>
      {regErr && <p className={styles.errText}>{regErr}</p>}
      <button
        disabled={value.length !== 6}
        onClick={handleSubmit}
        className={styles.subBtn}
      >
        {t("otp_submit")}
      </button>
    </div>
  );
};

export default PinInpPassForm;
