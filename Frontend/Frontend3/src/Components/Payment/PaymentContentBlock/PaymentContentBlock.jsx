import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import * as yup from "yup";
import { useActions } from "../../../hook/useAction";

import Checkbox from "../../../ui/CheckBox/CheckBox";
import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import PaymentInp from "../../../ui/PaymentInp/PaymentInp";
import MobPaymentBasket from "../MobPaymentBasket/MobPaymentBasket";

import arrLeft from "../../../assets/Payment/arrLeft.svg";
import CustomBreadcrumbs from "../../../ui/CustomBreadCrumps/CustomBreadCrumps";

import styles from "./PaymentContentBlock.module.scss";

const PaymentContentBlock = ({ setSection }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const { t } = useTranslation();

  const paymentInfo = localStorage.getItem("payment");

  const { basketSelectedProductsPrice, editValue } = useActions();

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .typeError(t("validation.email.typeError"))
      .email(t("validation.email.email"))
      .required(t("validation.email.required")),
    country: yup.string().required(t("validation.country.required")),
    name: yup.string().required(t("validation.name.required")),
    surename: yup.string().required(t("validation.surename.required")),
    address: yup.string().required(t("validation.address.required")),
    phone: yup.string().required(t("validation.phone.required")),
  });

  const formik = useFormik({
    initialValues: {
      email: paymentInfo ? paymentInfo.email : "",
      country: paymentInfo ? paymentInfo.country : "",
      name: paymentInfo ? paymentInfo.name : "",
      surename: paymentInfo ? paymentInfo.surname : "",
      address: paymentInfo ? paymentInfo.address : "",
      phone: paymentInfo ? paymentInfo.phone : "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      console.log(values);
      editValue(values);
      if (!paymentInfo) {
        localStorage.setItem("payment", JSON.stringify(values));
      }
    },
  });

  useEffect(() => {
    localStorage.removeItem("payment");
    basketSelectedProductsPrice();
  }, []);

  const { email, address, country, name, phone, surename } = formik.values;

  const handleNext = () => {
    formik.handleSubmit();
    setSection(2);
  };

  const handleReturn = () => {
    if (isMobile) {
      localStorage.removeItem("payment");
      navigate("/mob_basket");
    } else {
      localStorage.removeItem("payment");
      navigate("/basket");
    }
  };

  return (
    <div className={styles.main}>
      <div>
        <h3 onClick={() => navigate("/")} className={styles.title}>
          Reli Group s.r.o
        </h3>
        {isMobile && <MobPaymentBasket />}
        <CustomBreadcrumbs />
      </div>
      <PaymentInp
        title={"Email"}
        name="email"
        value={email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        err={formik.errors.email}
      />
      <div className={styles.adressDiv}>
        <h3 className={styles.sectionTitle}>{t("add_address")}</h3>
        <PaymentInp
          title={t("region_city")}
          name="country"
          value={country}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          err={formik.errors.country}
        />
        <div className={styles.smallInpDiv}>
          <PaymentInp
            title={t("pay_name")}
            name="name"
            value={name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            err={formik.errors.name}
          />
          <PaymentInp
            title={t("pay_surname")}
            name="surename"
            value={surename}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            err={formik.errors.surename}
          />
        </div>
        <PaymentInp
          title={t("pay_address")}
          name="address"
          value={address}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          err={formik.errors.address}
        />
        <PaymentInp
          title={t("pay_phone")}
          name="phone"
          value={phone}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          err={formik.errors.phone}
        />
        <label className={styles.checkDiv}>
          <Checkbox />
          <span>{t("save_info_for_future")}</span>
        </label>
      </div>
      <div className={styles.buttonDiv}>
        <button onClick={handleReturn}>
          <img src={arrLeft} alt="" />
          <span>{t("back_to_basket")}</span>
        </button>
        <button disabled={!formik.isValid} onClick={handleNext}>
          {t("continue_sending")}
        </button>
      </div>
    </div>
  );
};

export default PaymentContentBlock;
