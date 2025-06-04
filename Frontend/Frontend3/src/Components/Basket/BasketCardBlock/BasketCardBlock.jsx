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

import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import CheckBox from "../../../ui/CheckBox/CheckBox";
import BasketCard from "../BasketCard/BasketCard";

import arrLeft from "../../../assets/mobileIcons/arrLeftIcon.svg";

import styles from "./BasketCardBlock.module.scss";
import CustomBreadcrumbs from "../../../ui/CustomBreadCrumps/CustomBreadCrumps";
import PayAndCartBread from "../../../ui/PaymentAndBasketBreadcrumbs/PayAndCartBread";

const BasketCardBlock = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const navigate = useNavigate();

  const { t } = useTranslation();

  const basket = useSelector((state) => state.basket.basket) || [];
  const basketSearch =
    useSelector((state) => state.basket.filteredBasket) || [];

  const basketSelectedProducts =
    useSelector((state) => state.basket.selectedProducts) || [];

  const dispatch = useDispatch();

  console.log(basket);


  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const storedBasketTotal = localStorage.getItem("basketTotal");
    const storedSelectedProducts = localStorage.getItem("selectedProducts");

    // Убедись, что данные из localStorage правильно сохраняются
    if (!storedBasketTotal) {
      localStorage.setItem("basketTotal", JSON.stringify(0));
    }

    if (!storedSelectedProducts) {
      localStorage.setItem("selectedProducts", JSON.stringify([]));
    }
  }, []);

  useEffect(() => {
    // Получаем корзину из localStorage
    const localBasket = JSON.parse(localStorage.getItem("basket"));

    // Если в Redux нет данных (basket пуст) и данные в localStorage существуют
    if (basket.length === 0 && localBasket && localBasket.length > 0) {
      // Проверяем, отличаются ли данные в localStorage и в Redux
      if (JSON.stringify(basket) !== JSON.stringify(localBasket)) {
        dispatch(updateBasket(localBasket)); // Обновляем Redux корзину данными из localStorage
      }
    }
  }, [basket, dispatch]);

  useEffect(() => {
    if (selectAll) {
      dispatch(selectAllProducts());
    }
  }, [selectAll, dispatch]);

  useEffect(() => {
    setSelectAll(basket.every((item) => item.selected === true));
  }, [basket]);

  useEffect(() => {
    if (basket.length === 0) {
      setSelectAll(false);
    }
  }, [basket]);

  const handleChange = () => {
    if (selectAll) {
      dispatch(deselectAllProducts());
    } else {
      setSelectAll(true);
    }
  };

  return (
    <div className={styles.main}>
      {!isMobile && (
        <Link to={"/"} className={styles.title}>
          Reli Group s.r.o.
        </Link>
      )}
      {/* <CustomBreadcrumbs /> */}
      <PayAndCartBread  />
      {isMobile && (
        <button className={styles.mobReturnBtn} onClick={() => navigate(-1)}>
          <img src={arrLeft} alt="" />
          <p>{t("shopping_card")}</p>
        </button>
      )}
      <div className={styles.checkBoxDiv}>
        {/* <label
          onClick={() => {
            if (selectAll) {
              dispatch(deselectAllProducts());
            } else {
              setSelectAll(!selectAll);
            }
          }}
        >
          <CheckBox check={selectAll} />
          <p>{t("select_all")}</p>
        </label> */}
        <label className={styles.selectLabel}>
          <input
            className={styles.selectInp}
            type="checkbox"
            checked={selectAll}
            onChange={handleChange}
          />
          <span></span>
          <p>Select all</p>
        </label>
        <span>{`${basket?.length} ${t("count")}`}</span>
      </div>
      <div>
        {basketSearch.length > 0 ? (
          basketSearch.map((item) => (
            <BasketCard
              key={item.sku}
              productData={item}
              section={"basket"}
              all={selectAll}
            />
          ))
        ) : basket.length > 0 ? (
          basket.map((item) => (
            <BasketCard
              key={item.sku}
              productData={item}
              section={"basket"}
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
