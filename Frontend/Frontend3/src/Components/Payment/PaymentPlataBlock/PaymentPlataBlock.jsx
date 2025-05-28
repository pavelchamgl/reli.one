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

const PaymentPlataBlock = ({ setSection }) => {
  const isMobile = useMediaQuery({ maxWidth: 500 });
  const [plataType, setPlataType] = useState("card");
  const [inputError, setInputError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false)
  const [authEnd, setAuthEnd] = useState(false)
  const [openAgeModal, setOpenAgeModal] = useState(false)
  const [ageCheck, setAgeCheck] = useState(false)

  const { t } = useTranslation();

  const { email, city, street } = useSelector(
    (state) => state.payment.paymentInfo
  );

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

  const token = localStorage.getItem("token")

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const returnBtn = () => {
    setSection(2);
  };

  const handleSubmit = () => {

    console.log(token);

    if (!token) {
      if (isMobile) {
        navigate("/mob_login")
      } else {
        setModalOpen(true)
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
          Reli Group s.r.o
        </h3>
        {isMobile && <MobPaymentBasket />}
        <CustomBreadcrumbs />
      </div>
      <div className={styles.inpDiv}>
        <PaymentDeliveryInp desc={"email"} value={email} title={"Email"} setSection={() => setSection(1)} />
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
        {!isMobile && (
          <label className={styles.checkDiv}>
            <CheckBox />
            <span>{t("save_info_for_future")}</span>
          </label>
        )}
      </div>
      {error && <p className={styles.errText}>{error}</p>}
      <div className={styles.buttonDiv}>
        <button onClick={returnBtn}>
          <img src={arrLeft} alt="" />
          <span>{t("back_to_delivery")}</span>
        </button>
        <button
          //  disabled={inputError} 
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
