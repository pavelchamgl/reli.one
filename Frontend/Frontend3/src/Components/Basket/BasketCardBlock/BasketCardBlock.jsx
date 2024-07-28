import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAllProducts,
  deselectAllProducts,
} from "../../../redux/basketSlice";

import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import CheckBox from "../../../ui/CheckBox/CheckBox";
import BasketCard from "../BasketCard/BasketCard";

import arrLeft from "../../../assets/mobileIcons/arrLeftIcon.svg";

import styles from "./BasketCardBlock.module.scss";
import CustomBreadcrumbs from "../../../ui/CustomBreadCrumps/CustomBreadCrumps";

const BasketCardBlock = () => {
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const navigate = useNavigate();

  const { t } = useTranslation();

  const basket = useSelector((state) => state.basket.basket) || [];
  const basketSearch =
    useSelector((state) => state.basket.filteredBasket) || [];
  const dispatch = useDispatch();

  const [selectAll, setSelectAll] = useState(
    basket.every((item) => item.selected === true)
  );

  useEffect(() => {
    const storedBasketTotal = localStorage.getItem("basketTotal");
    const storedSelectedProducts = localStorage.getItem("selectedProducts");

    if (!storedBasketTotal) {
      localStorage.setItem("basketTotal", JSON.stringify(0));
    }

    if (!storedSelectedProducts) {
      localStorage.setItem("selectedProducts", JSON.stringify([]));
    }
  }, []);

  useEffect(() => {
    if (selectAll) {
      dispatch(selectAllProducts());
    } else {
      dispatch(deselectAllProducts());
    }
  }, [selectAll, dispatch]);

  return (
    <div className={styles.main}>
      {!isMobile && (
        <Link to={"/"} className={styles.title}>
          Reli Group s.r.o
        </Link>
      )}
      <CustomBreadcrumbs />
      {isMobile && (
        <button className={styles.mobReturnBtn} onClick={() => navigate(-1)}>
          <img src={arrLeft} alt="" />
          <p>{t("shopping_card")}</p>
        </button>
      )}
      <div className={styles.checkBoxDiv}>
        <div onClick={() => setSelectAll(!selectAll)}>
          <CheckBox check={selectAll} />
          <p>{t("select_all")}</p>
        </div>
        <span>{`${basket?.length} ${t("count")}`}</span>
      </div>
      <div>
        {basketSearch.length > 0 ? (
          basketSearch.map((item) => (
            <BasketCard
              key={item.id}
              productData={item}
              section={"basket"}
              all={selectAll}
            />
          ))
        ) : basket.length > 0 ? (
          basket.map((item) => (
            <BasketCard
              key={item.id}
              productData={item}
              section={"basket"}
              all={selectAll}
            />
          ))
        ) : (
          <div className={styles.emptyDiv}>
            <p>The basket is still empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketCardBlock;
