import { useState } from "react";

import arrTop from "../../assets/Filter/arrTop.svg";
import arrBottom from "../../assets/Filter/arrBottom.svg";
import checkedRadio from "../../assets/Filter/checkedRadio.svg";
import notCheckedRadio from "../../assets/Filter/notCheckedRadio.svg";

import styles from "./FilterByPopularity.module.scss";

const FilterByPopularity = () => {
  const [open, setOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("popularita");

  return (
    <div className={styles.main}>
      <button onClick={() => setOpen(!open)} className={styles.btn}>
        <p>Popularita</p>
        <img src={open ? arrTop : arrBottom} alt="" />
      </button>
      <div className={open ? styles.selectDiv : styles.selectDivHid}>
        <button
          onClick={() => setFilterValue("popularita")}
          className={styles.radioInpBtn}
        >
          <img
            src={filterValue === "popularita" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>Popularita</p>
        </button>
        <button
          onClick={() => setFilterValue("Vzestupná cena")}
          className={styles.radioInpBtn}
        >
          <img
            src={filterValue === "Vzestupná cena" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>Vzestupná cena</p>
        </button>
        <button
          onClick={() => setFilterValue("Cena sestupně")}
          className={styles.radioInpBtn}
        >
          <img
            src={filterValue === "Cena sestupně" ? checkedRadio : notCheckedRadio}
            alt=""
          />
          <p>Cena sestupně</p>
        </button>
      </div>
    </div>
  );
};

export default FilterByPopularity;
