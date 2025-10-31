import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { searchProducts } from "../../../redux/basketSlice";

import Container from "../../../ui/Container/Container";
import arrRight from "../../../assets/Basket/arrRight.svg";

import styles from "./BasketTotalBlock.module.scss";

const BasketTotalBlock = ({ section = null }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const isMobile = useMediaQuery({ maxWidth: 426 });

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const totalPrice = useSelector((state) => state.basket.totalCount);
  const selectedProducts = useSelector((state) => state.basket.selectedProducts);
  const { groups } = useSelector((state) => state.payment);

  const [style, setStyle] = useState({
    padding: "63px 59px",
    height: "100vh",
    marginBottom: "71px",
  });

  const deliveryPrice = Array.isArray(groups)
    ? groups.reduce((sum, item) => sum + Number(item?.deliveryPrice || 0), 0)
    : 0;



  const isBasketPage = pathname === "/basket" || pathname === "/mob_basket";
  const isPaymentPage = pathname === "/payment" && section >= 2;

  const finalPrice = isPaymentPage
    ? totalPrice + deliveryPrice
    : totalPrice;

  const normalizedFinalPrice = Math.abs(finalPrice) < 0.005 ? 0 : finalPrice;

  useEffect(() => {
    console.log(deliveryPrice);

  }, [deliveryPrice])

  useEffect(()=>{
    console.log(normalizedFinalPrice);
    
    localStorage.setItem("totalPrice", normalizedFinalPrice)
  },[finalPrice])

  useEffect(() => {
    if (isMobile && isPaymentPage) {
      setStyle({
        padding: "0px 0px 27px",
        marginBottom: "11px",
        borderBottom: "1px solid #e1e1e1",
      });
    } else {
      setStyle({
        padding: "63px 59px",
        height: "100vh",
        marginBottom: "71px",
      });
    }
  }, [isMobile, isPaymentPage]);

  return (
    <div
      style={isPaymentPage ? style : {}}
      className={styles.main}
    >
      {isMobile && <p className={styles.mobText}>Propagační kód</p>}

      <div className={styles.mainContent}>
        <div className={styles.inpDiv}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => dispatch(searchProducts({ text: searchTerm }))}
          >
            <span>{t("basket_use")}</span>
            <img src={arrRight} alt="" />
          </button>
        </div>

        <div className={styles.textDiv}>
          <div className={styles.priceDiv}>
            <span>{t("subtotal")}:</span>
            <p>{totalPrice?.toFixed(2)} €</p>
          </div>

          <div className={styles.calculateDiv}>
            <span>{t("transportation")}</span>
            <span>
              {isPaymentPage
                ? `${deliveryPrice ? deliveryPrice?.toFixed(2) : 0} €`
                : t("transportation_calculate_text")}
            </span>
          </div>
        </div>

        <div className={styles.totalDiv}>
          <p>{t("total")}</p>
          <div>
            <span>EUR</span>
            <strong>{normalizedFinalPrice?.toFixed(2)} €</strong>
          </div>
        </div>

        {isBasketPage && (
          <button
            className={styles.continueBtn}
            onClick={() => navigate("/payment")}
            disabled={!selectedProducts.length}
          >
            {t("basket_continue")}
          </button>
        )}
      </div>
    </div>
  );
};

export default BasketTotalBlock;
