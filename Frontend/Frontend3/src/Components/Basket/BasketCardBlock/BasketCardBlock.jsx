import { useState } from "react";

import BreadCrumps from "../../../ui/BreadCrumps/BreadCrumps";
import CheckBox from "../../../ui/CheckBox/CheckBox";
import BasketCard from "../BasketCard/BasketCard";

import styles from "./BasketCardBlock.module.scss";

const BasketCardBlock = () => {
  const [selectAll, setSelectAll] = useState(false);

  return (
    <div className={styles.main}>
      <h3 className={styles.title}>Reli Group s.r.o</h3>
      <BreadCrumps />
      <div className={styles.checkBoxDiv}>
        <div onClick={() => setSelectAll(!selectAll)}>
          <CheckBox />
          <p>Vybrat vše</p>
        </div>
        <span>2 zboží</span>
      </div>
      <div>
        <BasketCard section={"basket"} all={selectAll} />
        <BasketCard section={"basket"} all={selectAll} />
        <BasketCard section={"basket"} all={selectAll} />
        <BasketCard section={"basket"} all={selectAll} />
        <BasketCard section={"basket"} />
        <BasketCard />
        <BasketCard />
      </div>
      {/* <div className={styles.emptyDiv}>
        <p>The basket is still empty</p>
      </div> */}
    </div>
  );
};

export default BasketCardBlock;
