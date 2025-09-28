import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import {
  selectAllProducts,
  deselectAllProducts,
  updateBasket,
} from "../../../redux/basketSlice";

import BasketCard from "../BasketCard/BasketCard";
import PayAndCartBread from "../../../ui/PaymentAndBasketBreadcrumbs/PayAndCartBread";

import arrLeft from "../../../assets/mobileIcons/arrLeftIcon.svg";

import styles from "./BasketCardBlock.module.scss";

const BasketCardBlock = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const basket = useSelector((state) => state.basket.basket) || [];
  const basketSearch = useSelector((state) => state.basket.filteredBasket) || [];

  const [selectAll, setSelectAll] = useState(false);

  // Выделить все товары при нажатии
  const handleChange = () => {
    if (selectAll) {
      dispatch(deselectAllProducts());
    } else {
      dispatch(selectAllProducts());
    }
  };

  // Синхронизируем состояние чекбокса "Выбрать все"
  useEffect(() => {
    const allSelected = basket.length > 0 && basket.every((item) => item.selected === true);
    setSelectAll(allSelected);
  }, [basket]);

  return (
    <div className={styles.main}>
      {!isMobile && (
        <Link to="/" className={styles.title}>
          Reli Group s.r.o.
        </Link>
      )}

      <PayAndCartBread />

      {isMobile && (
        <button className={styles.mobReturnBtn} onClick={() => navigate(-1)}>
          <img src={arrLeft} alt="Back" />
          <p>{t("shopping_card")}</p>
        </button>
      )}

      <div className={styles.checkBoxDiv}>
        <label className={styles.selectLabel}>
          <input
            className={styles.selectInp}
            type="checkbox"
            checked={selectAll}
            onChange={handleChange}
          />
          <span></span>
          <p>{t("select_all")}</p>
        </label>
        <span>{`${basket.length} ${t("count")}`}</span>
      </div>

      <div>
        {basketSearch.length > 0 ? (
          basketSearch.map((item) => (
            <BasketCard
              key={item.sku}
              productData={item}
              section="basket"
              all={selectAll}
            />
          ))
        ) : basket.length > 0 ? (
          basket.map((item) => (
            <BasketCard
              key={item.sku}
              productData={item}
              section="basket"
              all={selectAll}
            />
          ))
        ) : (
          <div className={styles.emptyDiv}>
            <p>{t("basket_empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketCardBlock;
