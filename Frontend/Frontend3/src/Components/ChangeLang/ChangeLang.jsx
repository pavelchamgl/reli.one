import { useState, useRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive";

import langGeoIcon from "../../assets/Header/langGeo.svg";
import checkedRadio from "../../assets/Filter/checkedRadio.svg";
import notCheckedRadio from "../../assets/Filter/notCheckedRadio.svg";

import styles from "./ChangeLang.module.css";

const ChangeLang = () => {
  const [langSelectClick, setLangSelectClick] = useState(false);

  const [langValue, setLangValue] = useState("сzech");

  const isPlanshet = useMediaQuery({ maxWidth: 950 });

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

  return (
    <div className={styles.wrap}>
      <button
        onClick={() => setLangSelectClick(!langSelectClick)}
        className={styles.selectBtn}
      >
        <img src={langGeoIcon} alt="" />
        <p>Jazyk</p>
      </button>
      <div
        ref={selectDivRef}
        style={position}
        className={langSelectClick ? styles.selectDiv : styles.selectDivHid}
      >
        <button
          onClick={() => setLangValue("сzech")}
          className={styles.radioInpBtn}
        >
          <img
            src={langValue === "сzech" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>Česky</p>
        </button>
        <button
          onClick={() => setLangValue("english")}
          className={styles.radioInpBtn}
        >
          <img
            src={langValue === "english" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>Angličtina</p>
        </button>
        <button
          onClick={() => setLangValue("german")}
          className={styles.radioInpBtn}
        >
          <img
            src={langValue === "german" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>Němčina</p>
        </button>
      </div>
    </div>
  );
};

export default ChangeLang;
