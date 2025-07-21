import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";

import { login } from "../../../api/auth";
import CheckBox from "../../../ui/CheckBox/CheckBox";
import closeEye from "../../../assets/Input/closeEyesIcon.svg";
import openEye from "../../../assets/Input/openEyesIcon.svg";

import styles from "./MobLoginForm.module.scss";

import { useSelector, useDispatch } from "react-redux";
import { updateBasket, syncBasket } from "../../../redux/basketSlice";
import { useActionPayment } from "../../../hook/useActionPayment";
import GoogleAuth from "../../Auth/googleAuth/GoogleAuth";
import FacebookAuth from "../../Auth/facebookAuth/FacebookAuth";

const MobLoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [type, setType] = useState("password");
  const [regErr, setRegErr] = useState("");
  const [isLogged, setIsLoged] = useState(false)


  const basketLocal = useSelector((state) => state.basket.basket) || [];
  const baskets = useSelector((state) => state.basket.baskets) || [];

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

  const { setIsBuy, setPageSection } = useActionPayment()

  const { isBuy } = useSelector((state) => state.payment);


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

  const handleChangeType = () => {
    setType(type === "password" ? "text" : "password");
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
            <button type="button" onClick={handleChangeType}>
              <img src={type === "password" ? closeEye : openEye} alt="toggle visibility" />
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
        <button disabled={!formik.isValid} onClick={formik.handleSubmit}>
          {t("continue")}
        </button>
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

      <div className={styles.otherWaysWrap}>
        <p className={styles.otherWaysTitle}>Other ways to log in</p>
        <div className={styles.otherWaysBtns}>
          <GoogleAuth setIsLoged={setIsLoged} syncBasket={syncBasket} setRegErr={setRegErr} />
          <FacebookAuth />
        </div>
      </div>
    </div>
  );
};

export default MobLoginForm;
