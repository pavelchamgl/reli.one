import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useActions } from "../../hook/useAction";

import arrTop from "../../assets/Filter/arrTop.svg";
import arrBottom from "../../assets/Filter/arrBottom.svg";
import checkedRadio from "../../assets/Filter/checkedRadio.svg";
import notCheckedRadio from "../../assets/Filter/notCheckedRadio.svg";

import styles from "./FilterByPopularity.module.scss";
import { useLocation } from "react-router-dom";

const FilterByPopularity = ({
  setOrderingState = null,
  setOrdering = null,
}) => {
  const [open, setOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("rating");

  const { t } = useTranslation();

  const { pathname } = useLocation();

  useEffect(() => {
    if (setOrdering) {
      // if (pathname === "/liked") {
      if (filterValue === "rating") {
        setOrderingState("rating");
        setOrdering("rating");
      }
      if (filterValue === "price") {
        setOrderingState("price");
        setOrdering("price");
      }
      if (filterValue === "-price") {
        setOrderingState("-price");
        setOrdering("-price");
      }
      if (filterValue === "order") {
        setOrderingState("order");
        setOrdering("order");
      }
    }
  }, [filterValue]);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className={styles.main}>
      <button onClick={() => setOpen(!open)} className={styles.btn}>
        <p>{t("popularity")}</p>
        <img src={open ? arrTop : arrBottom} alt="" />
      </button>
      <div className={open ? styles.selectDiv : styles.selectDivHid}>
        <button
          onClick={() => setFilterValue("rating")}
          className={styles.radioInpBtn}
        >
          <img
            src={filterValue === "rating" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>{t("popularity")}</p>
        </button>
        <button
          onClick={() => setFilterValue("price")}
          className={styles.radioInpBtn}
        >
          <img
            src={filterValue === "price" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>{t("rising_price")}</p>
        </button>
        <button
          onClick={() => setFilterValue("-price")}
          className={styles.radioInpBtn}
        >
          <img
            src={filterValue === "-price" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>{t("price_descending")}</p>
        </button>
        {pathname === "/seller-goods-list" && (
          <button
            onClick={() => setFilterValue("order")}
            className={styles.radioInpBtn}
          >
            <img
              src={filterValue === "order" ? checkedRadio : notCheckedRadio}
              alt=""
            />
            <p>Order quantity</p>
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterByPopularity;
