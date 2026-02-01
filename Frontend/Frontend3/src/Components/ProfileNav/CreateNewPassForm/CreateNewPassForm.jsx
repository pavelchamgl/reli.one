import { useMediaQuery } from "react-responsive";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";

import { createNewPassApi } from "../../../api/auth";
import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./CreateNewPassForm.module.scss";

const CreateNewPassForm = () => {
  const [size, setSize] = useState("352px");
  const [regErr, setRegErr] = useState("");

  const isMobile = useMediaQuery({ maxWidth: 400 });

  const { t } = useTranslation();

  const navigate = useNavigate();

  const validationSchema = yup.object().shape({
    password: yup
      .string()
      .test("password", t("validation.password.passwordCriteria"), (value) => {
        return (
          /[a-z]/.test(value) && // содержит строчную букву
          /[A-Z]/.test(value) && // содержит прописную букву
          /\d/.test(value) && // содержит цифру
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value) // содержит специальный символ
        );
      })
      .min(8, t("validation.password.minLength")) // минимальная длина 6 символов
      .max(20, t("validation.password.maxLength")) // максимальная длина 15 символов
      .required(t("validation.password.required")), // обязательное поле
    confirm_password: yup
      .string()
      .oneOf([yup.ref("password"), null], t("validation.confirmPassword.oneOf")) // должен совпадать с полем "password"
      .required(t("validation.confirmPassword.required")), // обязательное поле
  });

  const email = localStorage.getItem("email")
    ? JSON.parse(localStorage.getItem("email"))
    : "";
  const otp = localStorage.getItem("otp")
    ? JSON.parse(localStorage.getItem("otp"))
    : "";

  const formik = useFormik({
    initialValues: {
      password: "",
      confirm_password: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      createNewPassApi({
        email: email.email,
        otp: otp,
        ...values,
      })
        .then((res) => {
          localStorage.removeItem("email");
          localStorage.removeItem("otp");
          // navigate("/");
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
                errorMessage.trim() || "OTP has expired or is invalid."
              );
            } else if (err.response.status === 404) {
              setRegErr("User with this email does not exist.");
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
      <h3 className={styles.title}>{t("change_pass")}</h3>
      <label className={styles.inpLabel}>
        <span>{t("password")}</span>
        <AuthInp
          value={formik.values.password}
          name="password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"password"}
          width={size}
          err={formik.errors.password}
        />
        <p className={styles.errText}>{formik.errors.password}</p>
      </label>
      <label className={styles.inpLabel}>
        <span>{t("password_confirmation")}</span>
        <AuthInp
          value={formik.values.confirm_password}
          name="confirm_password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"password"}
          width={size}
          err={formik.errors.confirm_password}
        />
        <p className={styles.errText}>{formik.errors.confirm_password}</p>
      </label>
      {regErr && <p className={styles.errText}>{regErr}</p>}
      <button
        disabled={!formik.isValid}
        onClick={formik.handleSubmit}
        className={styles.subBtn}
      >
        {t("change_password_btn")}
      </button>
    </div>
  );
};

export default CreateNewPassForm;
