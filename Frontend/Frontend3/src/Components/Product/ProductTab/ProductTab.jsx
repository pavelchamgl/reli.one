import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./ProductTab.module.scss";

const ProductTab = ({ setTab }) => {
  const [section, setSection] = useState("Charakteristika");

  const { t } = useTranslation();

  useEffect(() => {
    setTab(section);
  }, [section]);

  return (
    <div className={styles.main}>
      <button
        onClick={() => setSection("Charakteristika")}
        className={section === "Charakteristika" ? styles.tabAcc : styles.tab}
      >
        {t("characteristics")}
      </button>
      <button
        onClick={() => setSection("Recenze")}
        className={section === "Recenze" ? styles.tabAcc : styles.tab}
      >
        {t("review")}
      </button>
      <button
        onClick={() => setSection("Certifikáty")}
        className={section === "Certifikáty" ? styles.tabAcc : styles.tab}
      >
        {t("certificates")}
      </button>
    </div>
  );
};

export default ProductTab;
