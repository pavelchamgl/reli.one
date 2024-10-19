import { useState, useRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";

import langGeoIcon from "../../assets/Header/langGeo.svg";
import checkedRadio from "../../assets/Filter/checkedRadio.svg";
import notCheckedRadio from "../../assets/Filter/notCheckedRadio.svg";

import styles from "./ChangeLang.module.css";

const ChangeLang = () => {
  const [langSelectClick, setLangSelectClick] = useState(false);

  const [langValue, setLangValue] = useState("сzech");

  const isPlanshet = useMediaQuery({ maxWidth: 950 });

  const { t, i18n } = useTranslation();

  let position = {
    left: "0",
  };

  if (isPlanshet) {
    position = {
      left: "-77px",
    };
  }

  const selectDivRef = useRef(null);

  const handleClickOutside = (event) => {
    if (selectDivRef.current && !selectDivRef.current.contains(event.target)) {
      setLangSelectClick(false);
    }
  };

  useEffect(() => {
    if (langSelectClick) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [langSelectClick]);

  const handleChangeLang = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className={styles.wrap}>
      <button
        onClick={() => setLangSelectClick(!langSelectClick)}
        className={styles.selectBtn}
      >
        <img src={langGeoIcon} alt="" />
        <p>{t("language")}</p>
      </button>
      <div
        ref={selectDivRef}
        style={position}
        className={langSelectClick ? styles.selectDiv : styles.selectDivHid}
      >
        <button
          onClick={() => {
            setLangValue("сzech");
            handleChangeLang("cs");
          }}
          className={styles.radioInpBtn}
        >
          <img
            src={langValue === "сzech" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>{t("cs")}</p>
        </button>
        <button
          onClick={() => {
            setLangValue("english");
            handleChangeLang("en");
          }}
          className={styles.radioInpBtn}
        >
          <img
            src={langValue === "english" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>{t("en")}</p>
        </button>
        <button
          onClick={() => {
            setLangValue("german");
            handleChangeLang("de");
          }}
          className={styles.radioInpBtn}
        >
          <img
            src={langValue === "german" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>{t("de")}</p>
        </button>
      </div>
    </div>
  );
};

export default ChangeLang;
