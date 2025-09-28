import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import closeIcon from "../../../assets/Header/closeCatalogIcon.svg";
import burgerMenuIcon from "../../../assets/Header/BurgerIcon.svg";
import CatalogDrawer from "../CatalogDrawer/CatalogDrawer";

import styles from "./CatalogBtn.module.css";

const CatalogBtn = ({ loginModalOpen, profileNavOpen }) => {
  const [open, setOpen] = useState(false);

  const { pathname } = useLocation()

  const { t } = useTranslation()

  useEffect(() => {
    setOpen(false)
  }, [pathname, profileNavOpen, loginModalOpen])

  return (
    <>
      <button onClick={() => setOpen(!open)} className={styles.wrap}>
        <img src={open ? closeIcon : burgerMenuIcon} alt="" />
        <p>{t("catalog")}</p>
      </button>
      <CatalogDrawer open={open} handleClose={() => setOpen(false)} />
    </>
  );
};

export default CatalogBtn;
