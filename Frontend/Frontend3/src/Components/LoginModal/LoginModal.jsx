import { useEffect, useState } from "react";
import { Dialog } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";

import { login } from "../../api/auth.js";
import loginModalXIcon from "../../assets/loginModal/loginModalX.svg";
import AuthInp from "../../ui/AuthInp/AuthInp";
import CheckBox from "../../ui/CheckBox/CheckBox";

import styles from "./LoginModal.module.scss";
import { useSelector, useDispatch } from "react-redux";
import { updateBasket, syncBasket } from "../../redux/basketSlice";
import { useActionPayment } from "../../hook/useActionPayment.js";
import GoogleAuth from "../Auth/googleAuth/GoogleAuth.jsx";
import FacebookAuth from "../Auth/facebookAuth/FacebookAuth.jsx";

const LoginModal = ({ open, handleClose, text, basket = false }) => {
  const [regErr, setRegErr] = useState("");
  const [isLogged, setIsLoged] = useState(false)

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentBasket = useSelector((state) => state.basket.basket) || [];
  const baskets = useSelector((state) => state.basket.baskets) || [];

  const { setIsBuy, setPageSection } = useActionPayment()

  const validationLogin = yup.object().shape({
    email: yup
      .string()
      .email(t("validation.email.email"))
      .required(t("validation.email.required")),
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
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validationLogin,
    onSubmit: async (values) => {

      try {
        const res = await login(values)
        localStorage.setItem("token", JSON.stringify(res.data));
        localStorage.setItem("email", JSON.stringify(values.email));

        setIsLoged(true)

        dispatch(syncBasket())

        // setRegErr("");
        // handleClose();
        // setIsBuy(false)
        // navigate(0); // Обновление страницы

      } catch (err) {
        if (err.response) {
          if (err.response.status === 500) {
            setRegErr("An error occurred on the server. Please try again later.");
          } else if (err.response.status === 401) {
            const errorData = err.response.data;
            let errorMessage = "";

            for (const key in errorData) {
              if (Array.isArray(errorData[key])) {
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
          setRegErr("Failed to connect to the server. Check your internet connection.");
        }
      }


    },
  });

  useEffect(() => {
    if (isLogged && baskets.length > 0) {
      handleClose(); // Закрываем модалку после успешного логина и обновления корзины
      setIsBuy(false); // Можно сбросить флаг или выполнить другие действия
      setPageSection(3)
      navigate(0); // Обновление страницы, если это необходимо
    }
  }, [isLogged, baskets, handleClose, setIsBuy, navigate]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className={styles.modal}>
        <div className={styles.modalTitleDiv}>
          <p>{text}</p>
          <button onClick={handleClose}>
            <img src={loginModalXIcon} alt="close" />
          </button>
        </div>

        <div className={styles.mainContentDiv}>
          <div className={styles.mainContentWrap}>
            <label className={styles.inpLabel}>
              <p>{t("email_address")}</p>
              <AuthInp
                value={formik.values.email}
                name="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                type="text"
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
                  to="/email_pass_conf"
                >
                  {t("forgotten_password")}
                </Link>
              </div>
              <AuthInp
                value={formik.values.password}
                name="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                type="password"
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
              {t("dont_have_acc")}{" "}
              <Link onClick={handleClose} to="/sign_up">
                {t("register_here")}
              </Link>
            </p>
          </div>
        </div>

        <div className={styles.otherWaysWrap}>
          <p className={styles.otherWaysTitle}>{t("other_ways_log")}</p>
          <div className={styles.otherWaysBtns}>
            <GoogleAuth setRegErr={setRegErr} setIsLoged={setIsLoged} syncBasket={syncBasket} />
            <FacebookAuth setIsLoged={setIsLoged} setRegErr={setRegErr} syncBasket={syncBasket} />
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default LoginModal;
