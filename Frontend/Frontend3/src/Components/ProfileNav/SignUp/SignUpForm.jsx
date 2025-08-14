import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../../../api/auth";
import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./SignUpForm.module.scss";

const SignUpForm = () => {
  const [size, setSize] = useState("352px");
  const isMobile = useMediaQuery({ maxWidth: 400 });
  const [regErr, setRegErr] = useState("");
  const [agreeRules, setAgreeRules] = useState(false);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const validationSchema = yup.object().shape({
    first_name: yup.string().required(t("validation.name.required")),
    last_name: yup.string().required(t("validation.name.required")),
    email: yup
      .string()
      .typeError(t("validation.email.typeError"))
      .email(t("validation.email.email"))
      .required(t("validation.email.required")),
    phone: yup.string().required(t("validation.phone.required")),
    password: yup
      .string()
      .test("password", t("validation.password.passwordCriteria"), (value) => {
        return (
          /[a-z]/.test(value) &&
          /[A-Z]/.test(value) &&
          /\d/.test(value) &&
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
        );
      })
      .min(8, t("validation.password.minLength"))
      .max(20, t("validation.password.maxLength"))
      .required(t("validation.password.required")),
    confirm_password: yup
      .string()
      .oneOf([yup.ref("password"), null], t("validation.confirmPassword.oneOf"))
      .required(t("validation.confirmPassword.required")),
  });

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      register(values)
        .then((res) => {
          setRegErr("");
          localStorage.setItem("email", JSON.stringify(values.email));
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
                "An account with these details has already been registered."
              );
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
    <div className={styles.mainReg}>
      <h3 className={styles.title}>{t("register_title")}</h3>
      <label className={styles.inpLabel}>
        <span>{t("first_name")}</span>
        <AuthInp
          value={formik.values.first_name}
          name="first_name"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"text"}
          width={size}
          err={formik.errors.first_name}
        />
        <p className={styles.errText}>{formik.errors.first_name}</p>
      </label>
      <label className={styles.inpLabel}>
        <span>{t("surname")}</span>
        <AuthInp
          value={formik.values.last_name}
          name="last_name"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"text"}
          width={size}
          err={formik.errors.last_name}
        />
        <p className={styles.errText}>{formik.errors.last_name}</p>
      </label>
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
      <label className={styles.inpLabel}>
        <span>{t("telefon")}</span>
        <AuthInp
          value={formik.values.phone}
          name="phone"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"text"}
          width={size}
          err={formik.errors.phone}
        />
        <p className={styles.errText}>{formik.errors.phone}</p>
      </label>
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
      <label className={styles.checkDiv}>
        <CheckBox check={agreeRules} onChange={setAgreeRules} />
        <p>
          {t("you_agree")}
          <Link to={"/register_rules"}>{t("rules")}</Link>
        </p>
      </label>
      <p className={styles.errText}>{regErr}</p>
      <button
        disabled={!formik.isValid || !agreeRules} // Логика: кнопка активна только если форма валидна и чекбокс выбран
        onClick={formik.handleSubmit}
        className={styles.subBtn}
      >
        {t("sign_up")}
      </button>
    </div>
  );
};

export default SignUpForm;
