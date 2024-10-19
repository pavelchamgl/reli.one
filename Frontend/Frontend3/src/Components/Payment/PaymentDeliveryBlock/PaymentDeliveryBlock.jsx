import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { editValue } from "../../../redux/paymentSlice";
import { useActions } from "../../../hook/useAction";

import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import PaymentDeliveryInp from "../PaymentDeliveryInp/PaymentDeliveryInp";
import PaymentDeliverySelect from "../PaymentDeliverySelect/PaymentDeliverySelect";
import arrLeft from "../../../assets/Payment/arrLeft.svg";
import MobPaymentBasket from "../MobPaymentBasket/MobPaymentBasket";

import styles from "./PaymentDeliveryBlock.module.scss";
import CustomBreadcrumbs from "../../../ui/CustomBreadCrumps/CustomBreadCrumps";

const PaymentDeliveryBlock = ({ setSection }) => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const [paymentInfo, setPaymentInfo] = useState({});

  const paymentInfoLocal = useSelector((state) => state.payment.paymentInfo);

  useEffect(() => {
    setPaymentInfo(paymentInfoLocal);
  }, [paymentInfoLocal]);

  const { email, address } = paymentInfo || {};

  console.log(paymentInfo);

  const { plusMinusDelivery, basketSelectedProductsPrice } = useActions();

  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    basketSelectedProductsPrice();
  }, []);

  const handleSubmit = () => {
    if (paymentInfo.price) {
      plusMinusDelivery({ type: "plus", price: paymentInfo.price });
    }
    setSection(3);
  };

  const handleReturn = () => {
    localStorage.removeItem("payment");
    setSection(1);
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
      <div className={styles.inpDiv}>
        <PaymentDeliveryInp desc={"email"} value={email} title={"Email"} />
        <PaymentDeliveryInp
          desc={"address"}
          value={address}
          title={t("add_address")}
        />
      </div>
      <div>
        <p className={styles.sectionTitle}>{t("delivery")}</p>
        <PaymentDeliverySelect />
      </div>
      <div className={styles.buttonDiv}>
        <button onClick={handleReturn}>
          <img src={arrLeft} alt="" />
          <span>{t("back_to_info")}</span>
        </button>
        <button onClick={handleSubmit}>{t("proceed_checkout")}</button>
      </div>
    </div>
  );
};

export default PaymentDeliveryBlock;
