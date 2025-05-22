import { useState } from "react";

import closeIcon from "../../../assets/Header/closeCatalogIcon.svg";
import burgerMenuIcon from "../../../assets/Header/BurgerIcon.svg";
import CatalogDrawer from "../CatalogDrawer/CatalogDrawer";

import styles from "./CatalogBtn.module.css";

const CatalogBtn = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(!open)} className={styles.wrap}>
        <img src={open ? closeIcon : burgerMenuIcon} alt="" />
        <p>Catalogue</p>
      </button>
      <CatalogDrawer open={open} handleClose={() => setOpen(false)} />
    </>
  );
};

export default CatalogBtn;
