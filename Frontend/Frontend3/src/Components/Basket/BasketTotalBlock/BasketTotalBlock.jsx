import { useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { searchProducts } from "../../../redux/basketSlice";

import Container from "../../../ui/Container/Container";
import arrRight from "../../../assets/Basket/arrRight.svg";

import styles from "./BasketTotalBlock.module.scss";

const BasketTotalBlock = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const totalPrice = useSelector((state) => state.basket.totalCount);

  const localPrice = JSON.parse(localStorage.getItem("basketTotal"));

  const [price, setPrice] = useState(totalPrice);

  const selectedProducts = useSelector(
    (state) => state.basket.selectedProducts
  );
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const [style, setStyle] = useState({
    padding: " 63px 59px",
    height: "100vh",
    marginBottom: "71px",
  });

  useEffect(() => {
    if (isMobile && location.pathname === "/payment") {
      setStyle({
        padding: "0px 0px 27px",
        marginBottom: "11px",
        borderBottom: "1px solid #e1e1e1",
      });
    } else {
      setStyle({
        padding: " 63px 59px",
        height: "100vh",
        marginBottom: "71px",
      });
    }
  }, [isMobile]);

  useEffect(() => {
    setPrice(localPrice);
  }, [localPrice]);

  return (
    <>
      <div
        style={location.pathname === "/payment" ? style : {}}
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
              <p>{price?.toFixed(2)} €</p>
            </div>
            <div className={styles.calculateDiv}>
              <span>{t("transportation")}</span>

              <span>{t("transportation_calculate_text")}</span>
            </div>
          </div>
          <div className={styles.totalDiv}>
            <p>{t("total")}</p>
            <div>
              <span>EUR</span>
              <strong>{price?.toFixed(2)} €</strong>
            </div>
          </div>
          {(location.pathname === "/basket" ||
            location.pathname === "/mob_basket") && (
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
    </>
  );
};

export default BasketTotalBlock;
