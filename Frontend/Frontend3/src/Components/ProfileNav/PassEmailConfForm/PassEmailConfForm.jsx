import { useMediaQuery } from "react-responsive";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";

import { passSendOtp } from "../../../api/auth";
import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./PassEmailConfFrom.module.scss";

const PassEmailConfForm = () => {
  const [size, setSize] = useState("352px");
  const [regErr, setRegErr] = useState("");

  const isMobile = useMediaQuery({ maxWidth: 400 });

  const { t } = useTranslation();

  const navigate = useNavigate();

  const validationForgot = yup.object().shape({
    email: yup
      .string()
      .typeError(({ path }) => t(`validation.email.typeError`))
      .email(t(`validation.email.email`))
      .required(t(`validation.email.required`)),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: validationForgot,
    onSubmit: (values) => {
      console.log(values);
      passSendOtp(values)
        .then((res) => {
          console.log(res);
          localStorage.setItem("email", JSON.stringify(values));
          navigate("/otp_pass_conf");
        })
        .catch((err) => {
          console.log(err);

          if (err.response) {
            if (err.response.status === 500) {
              setRegErr("Произошла ошибка на сервере. Попробуйте позже.");
            } else if (err.response.status === 400) {
              const errorData = err.response.data;
              let errorMessage = "";

              for (const key in errorData) {
                if (errorData[key] && Array.isArray(errorData[key])) {
                  // Добавляем имя поля к сообщению об ошибке
                  errorMessage += `${key}: ${errorData[key].join(", ")} `;
                }
              }

              setRegErr(errorMessage.trim() || "Неверный запрос.");
            } else if (err.response.status === 404) {
              setRegErr("Такой пользователь не найден");
            } else {
              setRegErr("Произошла неизвестная ошибка.");
            }
          } else {
            // Обработка случаев, когда нет ответа (например, сетевые ошибки)
            setRegErr(
              "Не удалось подключиться к серверу. Проверьте ваше интернет-соединение."
            );
          }
        });
    },
  });

  useEffect(() => {
    if (isMobile) {
      setSize("286px");
    } else {
      setSize("352px");
    }
  }, [isMobile]);

  return (
    <div className={styles.main}>
      <h3 className={styles.title}>{t("forgotten_password")}</h3>
      <p className={styles.text}>{t("email_conf_desc")}</p>
      <label className={styles.inpLabel}>
        <span>{t("sign_email")}</span>
        <AuthInp
          value={formik.values.email}
          name="email"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"text"}
          width={size}
          err={formik.errors.email}
        />
        <p className={styles.errText}>{formik.errors.email}</p>
      </label>
      {regErr && <p className={styles.errText}>{regErr}</p>}
      <button
        disabled={!formik.isValid}
        onClick={formik.handleSubmit}
        className={styles.subBtn}
      >
        {t("email_conf_send")}
      </button>
    </div>
  );
};

export default PassEmailConfForm;
