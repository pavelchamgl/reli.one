import { useEffect, useState } from "react";

import styles from "./ProductTab.module.scss";

const ProductTab = ({ setTab }) => {
  const [section, setSection] = useState("Charakteristika");

  useEffect(() => {
    setTab(section);
  }, [section]);

  return (
    <div className={styles.main}>
      <button
        onClick={() => setSection("Charakteristika")}
        className={section === "Charakteristika" ? styles.tabAcc : styles.tab}
      >
        Charakteristika
      </button>
      <button
        onClick={() => setSection("Recenze")}
        className={section === "Recenze" ? styles.tabAcc : styles.tab}
      >
        Recenze
      </button>
      <button
        onClick={() => setSection("Certifikáty")}
        className={section === "Certifikáty" ? styles.tabAcc : styles.tab}
      >
        Certifikáty
      </button>
    </div>
  );
};

export default ProductTab;
