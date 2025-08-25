import { useMediaQuery } from "react-responsive";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";

import AuthInp from "../../../ui/AuthInp/AuthInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";

import styles from "./ProfileChangePass.module.scss";

const ProfileChangePass = () => {
  const [size, setSize] = useState("352px");

  const isMobile = useMediaQuery({ maxWidth: 400 });

  const { t } = useTranslation();

  const validationSchema = yup.object().shape({
    old_password: yup
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
    new_password: yup
      .string()
      .oneOf([yup.ref("password"), null], t("validation.confirmPassword.oneOf")) // должен совпадать с полем "password"
      .required(t("validation.confirmPassword.required")), // обязательное поле
  });

  const formik = useFormik({
    initialValues: {
      old_password: "",
      new_password: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
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
        <span>{t("old_passord")}</span>
        <AuthInp
          value={formik.values.old_password}
          name="old_password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"password"}
          width={size}
          err={formik.errors.old_password}
        />
        <p className={styles.errText}>{formik.errors.old_password}</p>
      </label>
      <label className={styles.inpLabel}>
        <span>{t("new_password")}</span>
        <AuthInp
          value={formik.values.new_password}
          name="new_password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          type={"password"}
          width={size}
          err={formik.errors.new_password}
        />
        <p className={styles.errText}>{formik.errors.new_password}</p>
      </label>
      <label className={styles.checkDiv}>
        <CheckBox />
        <p>{t("pass_change_conf")}</p>
      </label>
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

export default ProfileChangePass;
