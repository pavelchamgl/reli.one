import PinInput from "react-pin-input";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import styles from "./PinInpForm.module.scss";
import { sendOtp, emailConfirm, register } from "../../../api/auth";
import { useDispatch, useSelector } from "react-redux";
import { syncBasket } from "../../../redux/basketSlice";
import { useActionPayment } from "../../../hook/useActionPayment";

const PinInpForm = () => {
  const [time, setTime] = useState(59);
  const [regErr, setRegErr] = useState("");
  const [isLogged, setIsLoged] = useState(false);
  const [value, setValue] = useState("");

  const isMobile = useMediaQuery({ maxWidth: 500 });
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setIsBuy, setPageSection } = useActionPayment();
  const baskets = useSelector((state) => state.basket.baskets) || [];
  const { isBuy } = useSelector((state) => state.payment)
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
  const registerLocal = JSON.parse(localStorage.getItem("register"));

  // Проверка если пользователь уже зарегистрирован
  useEffect(() => {
    if (registerLocal) {
      navigate("/login"); // если пользователь уже зарегистрирован, редиректим его на страницу логина
    }
  }, [registerLocal, navigate]);

  const handleSubmit = async () => {
    try {
      const res = await emailConfirm({
        email: email,
        otp: value,
      });
      setRegErr("");
      localStorage.setItem("is_registered", JSON.stringify(true));
      localStorage.setItem("token", JSON.stringify(res.data));
      setIsLoged(true); // Устанавливаем isLogged в true после успешной регистрации
      dispatch(syncBasket()); // Синхронизация корзины после успешного логина

    } catch (err) {
      console.log(err);
      
      if (err.response) {
        if (err.response.status === 500) {
          setRegErr("An error occurred on the server. Please try again later.");
        } else if (err.response.status === 400) {
          setRegErr("The specified OTP has expired or is invalid");
        } else if (err.response.status === 404) {
          setRegErr("User with the specified email address not found");
        } else {
          setRegErr("An unknown error occurred.");
        }
      } else {
        setRegErr("Failed to connect to the server. Check your internet connection.");
      }
    }
  };

  // Используем useEffect, чтобы реагировать на изменения состояния isLogged
  useEffect(() => {
    if (isLogged && baskets.length > 0) {
      setRegErr("");
      if (isBuy) {
        navigate("/payment");
        setPageSection(3)
        setIsBuy(false)
      } else {
        navigate("/");
      }
    }
  }, [isLogged, baskets, setIsBuy, navigate]);

  const handleSendAgain = () => {
    sendOtp(email)
      .then(() => {
        setTime(59);
      })
      .catch((err) => {
        setRegErr("Failed to send OTP. Please try again later.");
      });
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

export default PinInpForm;
