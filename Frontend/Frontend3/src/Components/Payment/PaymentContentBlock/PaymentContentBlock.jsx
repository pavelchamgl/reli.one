import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useEffect, useRef, useState } from "react";
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
import CountrySelect from "../CountrySelect/CountrySelect";
import { useSelector } from "react-redux";
import { isValidPhone, isValidZipCode } from "../../../code/validation/validationPayment";
import PayAndCartBread from "../../../ui/PaymentAndBasketBreadcrumbs/PayAndCartBread";
import PaymentZipAndPhoneInp from "../../../ui/payment/PaymentZipAndPhoneInp/PaymentZipAndPhoneInp";
import PaymentPhoneInp from "../../../ui/payment/PaymentPhoneInp/PaymentPhoneInp";

const PaymentContentBlock = ({ section, setSection }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const [phoneValid, setPhoneValid] = useState(true)
  const [zipValid, setZipValid] = useState(true)

  const { t } = useTranslation();

  const { paymentInfo, country } = useSelector(state => state.payment)

  const { basketSelectedProductsPrice, editValue } = useActions();

  const phoneInteracted = useRef(false);
  const zipInteracted = useRef(false);

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .typeError(t("validation.email.typeError"))
      .email(t("validation.email.email"))
      .required(t("validation.email.required")),
    city: yup.string().required(t("validation.city.required")),
    name: yup.string().required(t("validation.name.required")),
    surename: yup.string().required(t("validation.surename.required")),
    street: yup.string().required(t("validation.street.required")),
    zip: yup.string().required(t("validation.zip.required")),
    build: yup.string().required(t("validation.build.required")),
    apartment: yup.string(),
    phone: yup.string().required(t("validation.phone.required")),
  });

  const formik = useFormik({
    initialValues: {
      email: paymentInfo ? paymentInfo.email : "",
      city: paymentInfo ? paymentInfo.city : "",
      name: paymentInfo ? paymentInfo.name : "",
      surename: paymentInfo ? paymentInfo.surename : "",
      zip: paymentInfo ? paymentInfo.zip : "",
      build: paymentInfo ? paymentInfo.build : "",
      street: paymentInfo ? paymentInfo.street : "",
      apartment: paymentInfo ? paymentInfo.apartment : "",
      phone: paymentInfo ? paymentInfo.phone : "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
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
  const { email, city, name, phone, surename, apartment, build, street, zip } = formik.values;

  useEffect(() => {
    if (phone && country) {
      const isValid = isValidPhone(phone, country);
      setPhoneValid(isValid);
    }
  }, [phone, country]);

  useEffect(() => {
    if (zip && country) {
      const isValid = isValidZipCode(country, zip);
      setZipValid(isValid);
    }
  }, [zip, country]);

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
          Reli Group s.r.o.
        </h3>
        {isMobile && <MobPaymentBasket section={section} />}
        <PayAndCartBread section={section} setSection={setSection} />
        {/* <CustomBreadcrumbs /> */}
      </div>
      <PaymentInp
        title={t("email")}
        name="email"
        value={email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        err={formik.errors.email}
      />
      <div className={styles.adressDiv}>
        <h3 className={styles.sectionTitle}>{t("add_address")}</h3>
        <div className={styles.inpWrap}>
          <CountrySelect />
          <PaymentInp
            title={t("city")}
            name="city"
            value={city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            err={formik.errors.city}
          />

        </div>
        <div className={styles.inpWrap}>
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
        <div className={styles.inpWrap}>
          <PaymentInp
            title={t("street")}
            name="street"
            value={street}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            err={formik.errors.street}
          />
          <PaymentZipAndPhoneInp
            title={isMobile ? t("postal_code") : `${t("postal_code")} ${t("zip_code")}`}
            name="zip"
            value={zip}
            onChange={
              (e) => {
                zipInteracted.current = true;
                formik.handleChange(e)
              }
            }
            onBlur={formik.handleBlur}
            err={zipInteracted.current && !zipValid ? "Please enter a valid zip code." : formik.errors.zip}
            fontNum={true}
          />
        </div>
        <div className={styles.inpWrap}>
          <PaymentInp
            title={t("building_number")}
            name="build"
            value={build}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            err={formik.errors.build}
            fontNum={true}
          />
          <PaymentInp
            title={t("apartment_number")}
            name="apartment"
            value={apartment}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            err={formik.errors.apartment}
            fontNum={true}
          />
        </div>

        <PaymentPhoneInp
          title={t("pay_phone")}
          name="phone"
          value={phone}
          onChange={(e) => {
            phoneInteracted.current = true;
            formik.handleChange(e)
          }}
          onBlur={formik.handleBlur}
          err={phoneInteracted.current && !phoneValid ? "Please enter a valid phone number." : formik.errors.phone}
          fontNum={true}
          formik={formik}
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
        <button
          disabled={
            !formik.isValid ||
            !email ||
            !country ||
            !name ||
            !phone ||
            !surename ||
            !build ||
            !street ||
            !zip ||
            !phoneValid ||
            !zipValid ||
            phone?.length === 0 ||
            zip?.length === 0
          }
          onClick={handleNext}
        >
          {t("continue_sending")}
        </button>
      </div>
    </div>
  );
};

export default PaymentContentBlock;
