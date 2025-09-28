import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";

import {
  fetchCreateStripeSession,
  fetchCreatePayPalSession,
} from "../../../redux/paymentSlice";
import Spinner from "../../../ui/Spiner/Spiner";
import MobPaymentBasket from "../MobPaymentBasket/MobPaymentBasket";
import CustomBreadcrumbs from "../../../ui/CustomBreadCrumps/CustomBreadCrumps";
import PaymentDeliveryInp from "../PaymentDeliveryInp/PaymentDeliveryInp";
import CheckBox from "../../../ui/CheckBox/CheckBox";
import PlataRadio from "../PlataRadio/PlataRadio";
import arrLeft from "../../../assets/Payment/arrLeft.svg";

import styles from "./PaymentPlataBlock.module.scss";
import LoginModal from "../../LoginModal/LoginModal";
import ConfirmYourAgeModal from "../ConfirmYourAgeModal/ConfirmYourAgeModal";
import PayAndCartBread from "../../../ui/PaymentAndBasketBreadcrumbs/PayAndCartBread";
import { useActionPayment } from "../../../hook/useActionPayment";
import { updateTotalPrice } from "../../../redux/basketSlice";

const PaymentPlataBlock = ({ section, setSection }) => {
  const isMobile = useMediaQuery({ maxWidth: 500 });
  const [plataType, setPlataType] = useState("card");
  const [inputError, setInputError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false)
  const [authEnd, setAuthEnd] = useState(false)
  const [openAgeModal, setOpenAgeModal] = useState(false)
  const [ageCheck, setAgeCheck] = useState(false)
  const [check, setCheck] = useState(false)

  const { t } = useTranslation();

  const { email, city, street } = useSelector(
    (state) => state.payment.paymentInfo
  );

  const { setIsBuy } = useActionPayment()

  const { loading, error, groups } = useSelector((state) => state.payment);

  const selectedProducts = useSelector(
    (state) => state.basket.selectedProducts
  );

  useEffect(() => {
    if (
      selectedProducts && selectedProducts.length > 0 && selectedProducts.some((item) => !!item?.product?.is_age_restricted)
    ) {
      setAgeCheck(true)
    } else {
      setAgeCheck(false)
    }
  }, [])

  useEffect(() => {
    dispatch(updateTotalPrice())
  }, [])


  const token = localStorage.getItem("token")

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const returnBtn = () => {
    setSection(2);
  };

  const handleSubmit = () => {


    if (!token) {
      if (isMobile) {
        navigate("/mob_login")
        setIsBuy(true)
      } else {
        setModalOpen(true)
        setIsBuy(true)
      }
    } else {
      if (ageCheck) {
        setOpenAgeModal(true)
      }
      else {
        if (plataType === "card") {
          dispatch(fetchCreateStripeSession());
        } else {
          dispatch(fetchCreatePayPalSession());
        }
      }
    }
  };

  // if (isAdult) {
  //   if (plataType === "card") {
  //     dispatch(fetchCreateStripeSession(selectedProducts));
  //   } else {
  //     dispatch(fetchCreatePayPalSession(selectedProducts));
  //   }
  // }

  return (
    <div className={styles.main}>
      <div>
        <h3 onClick={() => navigate("/")} className={styles.title}>
          Reli Group s.r.o.
        </h3>
        {isMobile && <MobPaymentBasket section={section} />}
        {/* <CustomBreadcrumbs /> */}
        <PayAndCartBread section={section} setSection={setSection} />
      </div>
      <div className={styles.inpDiv}>
        <PaymentDeliveryInp desc={"email"} value={email} title={t("email")} setSection={() => setSection(1)} />
        <PaymentDeliveryInp
          desc={"address"}
          city={city}
          street={street}
          title={t("add_address")}
          setSection={() => setSection(1)}
        />
        <PaymentDeliveryInp
          desc={"TK"}
          title={t("way_transportation")}
          setSection={() => setSection(2)}
          groups={groups}
          setInputError={setInputError}
        />
      </div>
      <div className={styles.plataDiv}>
        <p className={styles.sectionTitle}>{t("payment")}</p>
        <PlataRadio setPlata={setPlataType} />

        <label className={styles.checkDiv}>
          <CheckBox />
          <span>{t("save_info_for_future")}</span>
        </label>
        <label className={styles.checkDiv}>
          <CheckBox check={check} onChange={() => setCheck(!check)} />
          <span>
            {t("iAgreeToTerms.agreeToThe")}{" "}
            <a href="#">{t("iAgreeToTerms.terms")}</a>{" "}
            {t("iAgreeToTerms.and")}{" "}
            <a href="#">{t("iAgreeToTerms.privacy")}</a>
          </span>

        </label>

      </div>
      {error && <p className={styles.errText}>{error}</p>}
      <div className={styles.buttonDiv}>
        <button onClick={returnBtn}>
          <img src={arrLeft} alt="" />
          <span>{t("back_to_delivery")}</span>
        </button>
        <button
          disabled={inputError || !check}
          onClick={handleSubmit}>
          {loading ? <Spinner /> : <p>{t("pay_now")}</p>}
        </button>
      </div>
      <LoginModal basket={true} text={"Please log in/register to continue"} open={modalOpen} handleClose={() => setModalOpen(false)} />
      <ConfirmYourAgeModal plataType={plataType} open={openAgeModal} handleClose={() => setOpenAgeModal(false)} />
    </div>
  );
};

export default PaymentPlataBlock;
