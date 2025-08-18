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
import PaymentDeliverySuplier from "../PaymentDeliveruSuplier/PaymentDeliverySuplier";
import { groupBySeller } from "../../../code/code";
import { useActionPayment } from "../../../hook/useActionPayment";
import PayAndCartBread from "../../../ui/PaymentAndBasketBreadcrumbs/PayAndCartBread";

const PaymentDeliveryBlock = ({ section, setSection }) => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const [allHasDelivery, setAllHasDelivery] = useState(false)

  const { paymentInfo, groups } = useSelector((state) => state.payment);

  const { email, city, street } = paymentInfo || {};

  const { selectedProducts } = useSelector(state => state.basket)





  const { plusMinusDelivery, basketSelectedProductsPrice } = useActions();


  const { setGroups, clearDeliveryPrice } = useActionPayment()

  const navigate = useNavigate();

  const { t } = useTranslation();

  useEffect(() => {
    if (selectedProducts) {
      const grouped = groupBySeller(selectedProducts);
      setGroups(grouped)
      clearDeliveryPrice()
    }
  }, [selectedProducts])

  useEffect(() => {
    basketSelectedProductsPrice();
  }, []);

  const handleSubmit = () => {
    setSection(3);
  };

  const handleReturn = () => {
    localStorage.removeItem("payment");
    setSection(1);
  };

  useEffect(() => {
    if (groups && groups.length > 0 && groups?.every((item) => !!item.deliveryType)) {
      setAllHasDelivery(true)
    } else {
      setAllHasDelivery(false)
    }
  }, [groups])

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
          setSection={() => setSection(1)}
          title={t("add_address")}
        />
      </div>
      {
        groups && groups.length > 0 &&
        groups?.map((item, index) => (
          <PaymentDeliverySuplier index={index} key={index} group={item} />
        ))
      }


      <div className={styles.buttonDiv}>
        <button onClick={handleReturn}>
          <img src={arrLeft} alt="" />
          <span>{t("back_to_info")}</span>
        </button>
        <button disabled={!allHasDelivery} onClick={handleSubmit}>{t("proceed_checkout")}</button>
      </div>
    </div>
  );
};

export default PaymentDeliveryBlock;
