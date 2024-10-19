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

const PaymentPlataBlock = ({ setSection }) => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const [plataType, setPlataType] = useState("card");
  const [inputError, setInputError] = useState(false);

  const { t } = useTranslation();

  const { email, address, price, TK } = useSelector(
    (state) => state.payment.paymentInfo
  );

  const { loading, error } = useSelector((state) => state.payment);

  const selectedProducts = useSelector(
    (state) => state.basket.selectedProducts
  );

  useEffect(()=>{
    console.log(inputError);
    
  },[inputError])

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const returnBtn = () => {
    dispatch({
      type: "basket/plusMinusDelivery",
      payload: { type: "minus", price },
    });
    setSection(2);
  };

  const handleSubmit = () => {
    if (plataType === "card") {
      dispatch(fetchCreateStripeSession(selectedProducts));
    } else {
      dispatch(fetchCreatePayPalSession(selectedProducts));
    }
  };

  useEffect(() => {
    console.log(plataType);
  }, [plataType]);

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
        <PaymentDeliveryInp desc={"email"} value={email} title={"Email"} />
        <PaymentDeliveryInp
          desc={"address"}
          value={address}
          title={t("add_address")}
        />
        <PaymentDeliveryInp
          desc={"TK"}
          value={TK}
          title={t("way_transportation")}
          setSection={setSection}
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
        <button disabled={inputError} onClick={handleSubmit}>
          {loading ? <Spinner /> : <p>{t("pay_now")}</p>}
        </button>
      </div>
    </div>
  );
};

export default PaymentPlataBlock;
