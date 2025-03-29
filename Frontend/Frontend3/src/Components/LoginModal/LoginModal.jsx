import { useState } from "react";
import { Dialog } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";

import { login } from "../../api/auth.js";
import loginModalXIcon from "../../assets/loginModal/loginModalX.svg";
import AuthInp from "../../ui/AuthInp/AuthInp";
import CheckBox from "../../ui/CheckBox/CheckBox";
import BasketModal from "../Basket/BasketModal/BasketModal";

import styles from "./LoginModal.module.scss";
import { useMediaQuery } from "react-responsive";

const LoginModal = ({ open, handleClose, text, basket = false }) => {
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

  const basketLocal = JSON.parse(localStorage.getItem("basket")) || []
  const basketsLocal = JSON.parse(localStorage.getItem("baskets")) || []

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationLogin,
    onSubmit: (values) => {
      login(values)
        .then((res) => {
          localStorage.setItem("token", JSON.stringify(res.data));
          localStorage.setItem("email", JSON.stringify(values.email));
          if (basket) {
            if (basketsLocal.some((item) => item?.email === values.email)) {
              const emailBasket = basketsLocal.find(item => item?.email === values.email)
              const filteredBaskets = basketsLocal.filter(item => item?.email !== values.email)
              const filteredBasket = (emailBasket?.basket || []).filter(
                (item) => !basketLocal.some(basketItem => basketItem?.sku === item?.sku)
              );
              const basketUnselected = filteredBasket?.map((item) => {
                return {
                  ...item,
                  selected: false
                }
              })
              localStorage.setItem("baskets", JSON.stringify([
                ...filteredBaskets, {
                  email: values.email,
                  basket: [...basketUnselected, ...basketLocal]
                }
              ]))
              localStorage.setItem("basket", JSON.stringify([...basketUnselected, ...basketLocal]))
            } else {
              const allBaskets = [...basketsLocal, {
                email: values.email,
                basket: basketLocal
              }]
              localStorage.setItem("baskets", JSON.stringify(allBaskets))
            }
          }
          setRegErr("");
          handleClose();
          window.location.reload();
        })
        .catch((err) => {
          if (err.response) {
            if (err.response.status === 500) {
              setRegErr(
                "An error occurred on the server. Please try again later."
              );
            } else if (err.response.status === 401) {
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

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <div className={styles.modal}>
          <div className={styles.modalTitleDiv}>
            <p>{text}</p>
            <button onClick={handleClose}>
              <img src={loginModalXIcon} alt="" />
            </button>
          </div>

          <div className={styles.mainContentDiv}>
            <div className={styles.mainContentWrap}>
              <label className={styles.inpLabel}>
                <p>{t("email_address")}</p>
                <AuthInp
                  value={formik.values.email}
                  name={"email"}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  type={"text"}
                  err={formik.errors.email}
                />
                <p className={styles.errText}>{formik.errors.email}</p>
              </label>
              <label>
                <div className={styles.forgotPassWrap}>
                  <p>{t("password")}</p>
                  <Link
                    onClick={handleClose}
                    className={styles.link}
                    to={"/email_pass_conf"}
                  >
                    {t("forgotten_password")}
                  </Link>
                </div>
                <AuthInp
                  value={formik.values.password}
                  name={"password"}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  type={"password"}
                  err={formik.errors.password}
                />
                <p className={styles.errTextPass}>{formik.errors.password}</p>
              </label>

              <div className={styles.checkDiv}>
                <CheckBox />
                <p>{t("stay_logged_in")}</p>
              </div>
              {regErr && <p className={styles.errTextPass}>{regErr}</p>}
              <div className={styles.btnDiv}>
                <button
                  disabled={!formik.isValid}
                  onClick={formik.handleSubmit}
                  className={styles.submitBtn}
                >
                  {t("continue")}
                </button>
              </div>

              <p className={styles.registerLink}>
                {t("dont_have_acc")}
                <Link onClick={handleClose} to={"/sign_up"}>
                  {t("register_here")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LoginModal;
