import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";

import { login } from "../../../api/auth";
import CheckBox from "../../../ui/CheckBox/CheckBox";
import closeEye from "../../../assets/Input/closeEyesIcon.svg";
import openEye from "../../../assets/Input/openEyesIcon.svg";

import styles from "./MobLoginForm.module.scss";

const MobLoginForm = () => {
  const navigate = useNavigate();

  const [type, setType] = useState("password");
  const [regErr, setRegErr] = useState("");


  const { t } = useTranslation();

  const validationLogin = yup.object().shape({
    email: yup
      .string()
      .typeError(({ path }) => t(`validation.email.typeError`))
      .email(t(`validation.email.email`))
      .required(t(`validation.email.required`)),
    password: yup
      .string()
      .test("password", t(`validation.password.passwordCriteria`), (value) => {
        return (
          /[a-z]/.test(value) &&
          /[A-Z]/.test(value) &&
          /\d/.test(value) &&
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
        );
      })
      .min(8, t(`validation.password.minLength`))
      .max(20, t(`validation.password.maxLength`))
      .required(t(`validation.password.required`)),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationLogin,
    onSubmit: (values) => {
      console.log(values);
      login(values)
      .then((res) => {
        console.log(res);
        localStorage.setItem("token", JSON.stringify(res.data));
        setRegErr("");
        navigate("/")
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

  const handleChangeType = () => {
    if (type === "password") {
      setType("email");
    } else {
      setType("password");
    }
  };

  return (
    <div className={styles.main}>
      <p className={styles.title}>{t("login")}</p>
      <div className={styles.inpDiv}>
        <label
          className={formik.errors.email ? styles.inpLabelErr : styles.inpLabel}
        >
          <span>{t("email_address")}</span>
          <input
            value={formik.values.email}
            name="email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Email"
            type="text"
          />
          <p className={styles.errText}>{formik.errors.email}</p>
        </label>
        <label className={styles.inpLabel}>
          <div>
            <span>{t("password")}</span>
            <button onClick={() => navigate("/email_pass_conf")}>
              {t("forgotten_password")}
            </button>
          </div>
          <div
            className={
              formik.errors.password ? styles.passInpDivErr : styles.passInpDiv
            }
          >
            <input
              value={formik.values.password}
              name="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="password"
              type={type}
            />
            <button onClick={handleChangeType}>
              <img src={type === "password" ? closeEye : openEye} alt="" />
            </button>
          </div>
          <p className={styles.errText}>{formik.errors.password}</p>
        </label>
      </div>
      <label className={styles.checkDiv}>
        <CheckBox />
        <span>{t("stay_logged_in")}</span>
      </label>
      {regErr && <p className={styles.errText}>{regErr}</p>}
      <div className={styles.submitDiv}>
        <button disabled={!formik.isValid} onClick={formik.handleSubmit}>{t("continue")}</button>
        <div>
          <span>{t("dont_have_acc")}</span>
          <button
            onClick={() => navigate("/sign_up")}
            className={styles.regBtn}
          >
            {t("register_here")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobLoginForm;
