import { useState } from "react";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";
import NoContentText from "../ui/NoContentText/NoContentText";
import ActualSection from "../Components/Orders/ActualSeaction/ActualSection";
import HistorySection from "../Components/Orders/HistorySection/HistorySection";

import styles from "../styles/MyOrdersPage.module.scss";

const MyOrdersPage = () => {
  const [section, setSection] = useState("Aktuální");

  const { t } = useTranslation();

  return (
    <>
      <div className={styles.titleDiv}>
        <p className={styles.title}>{t("my_orders")}</p>
        <div className={styles.buttonDiv}>
          <button
            onClick={() => setSection("Aktuální")}
            className={
              section === "Aktuální" ? styles.buttonAcc : styles.button
            }
          >
            {t("current_tab")}
          </button>
          <button
            onClick={() => setSection("Historie")}
            className={
              section === "Historie" ? styles.buttonAcc : styles.button
            }
          >
            {t("history_tab")}
          </button>
        </div>
      </div>

      <Container>
        {section === "Aktuální" ? <ActualSection /> : <HistorySection />}
        <div className={styles.filterDiv}>{/* <FilterByPopularity /> */}</div>
        <div className={styles.likedProdWrap}>{/* <NoContentText /> */}</div>
      </Container>
    </>
  );
};

export default MyOrdersPage;
