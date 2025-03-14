import { useMediaQuery } from "react-responsive";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";

import { sendOtp } from "../../../api/auth";
import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./EmailConfFrom.module.scss";

const EmailConfForm = () => {
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
      sendOtp(values)
        .then((res) => {
          localStorage.setItem("email", JSON.stringify(values));
          navigate("/otp_conf");
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status === 500) {
              setRegErr(
                "An error occurred on the server. Please try again later."
              );
            } else if (err.response.status === 400) {
              const errorData = err.response.data;
              let errorMessage = "";

              for (const key in errorData) {
                if (errorData[key] && Array.isArray(errorData[key])) {
                  // Добавляем имя поля к сообщению об ошибке
                  errorMessage += `${key}: ${errorData[key].join(", ")} `;
                }
              }

              setRegErr(
                errorMessage.trim() ||
                  "No active account found with the given credentials."
              );
            } else if (err.response.status === 404) {
              setRegErr("User with the specified email address not found.");
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
      <h3 className={styles.title}>{t("pass_otp_title")}</h3>
      <p className={styles.text}>{t("pass_otp_desc")}</p>
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

export default EmailConfForm;
