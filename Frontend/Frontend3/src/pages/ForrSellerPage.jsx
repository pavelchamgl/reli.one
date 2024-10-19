import { useState } from "react";
import { useTranslation } from "react-i18next";

import Container from "../ui/Container/Container";
import ForSellerTable from "../ui/ForSellerTable/ForSellerTable";

import styles from "../styles/ForSellerPage.module.scss";

const ForrSellerPage = () => {
  const [section, setSection] = useState("market");

  const { t } = useTranslation();

  return (
    <Container>
      <div className={styles.main}>
        <p className={styles.title}>{t("for_seller")}</p>

        <div className={styles.container}>
          <div className={styles.linkDiv}>
            <a
              className={styles.linkItem}
              href="#market"
              style={{ color: section === "market" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("market")}
            >
              1.  {t("who_we_are_list")}
            </a>
            <a
              className={styles.linkItem}
              href="#choose"
              style={{ color: section === "choose" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("choose")}
            >
              1.1.  {t("why_choose_title")}
            </a>
            <a
              className={styles.linkItem}
              href="#info"
              style={{ color: section === "info" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("info")}
            >
              2.  {t("info_for_seller_title")}
            </a>
            <a
              className={styles.linkItem}
              href="#category"
              style={{ color: section === "category" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("category")}
            >
              2.2 {t("cost_by_category")}
            </a>
            <a
              className={styles.linkItem}
              href="#start"
              style={{ color: section === "start" ? "#3f7f6d" : "#000" }}
              onClick={() => setSection("start")}
            >
              3.  {t("start_selling_title")}
            </a>
          </div>

          <div id="market" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("who_we_are")}</h4>
            <p className={styles.textDesc}>{t("who_we_are_text")}</p>
          </div>

          <div id="choose" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("why_choose_title")}</h4>
            <ul className={styles.listDiv}>
              <li>{t("why_choose_list_1")}</li>
              <li>{t("why_choose_list_2")}</li>
              <li>{t("why_choose_list_3")}</li>
              <li>{t("why_choose_list_4")}</li>
              <li>{t("why_choose_list_5")}</li>
              <li>{t("why_choose_list_6")}</li>
              <li>{t("why_choose_list_7")}</li>
              <li>{t("why_choose_list_8")}</li>
              <li>{t("why_choose_list_9")}</li>
            </ul>
          </div>

          <div id="info" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("info_for_seller_title")}</h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              {t("info_for_seller_desc")}
            </p>
            <ul className={styles.listDiv}>
              <li>{t("info_for_seller_list_1")}</li>
              <li>{t("info_for_seller_list_2")}</li>
              <li>{t("info_for_seller_list_3")}</li>
              <li>{t("info_for_seller_list_4")}</li>
            </ul>
          </div>

          <div id="category" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("cost_by_category")}:</h4>
            <ForSellerTable />
          </div>

          <div id="start" className={styles.paragDiv}>
            <h4 className={styles.textTitle}>{t("start_selling_title")}</h4>
            <p className={styles.textDesc} style={{ marginBottom: "10px" }}>
              {t("start_selling_desc")}:
            </p>
            <ul className={styles.listDiv}>
              <li>{t("start_selling_list_1")}</li>
              <li>{t("start_selling_list_2")}</li>
              <li>{t("start_selling_list_3")}</li>
              <li>{t("start_selling_list_4")}</li>
              <li>{t("start_selling_list_5")}</li>
              <li>{t("start_selling_list_6")}</li>
              <li>{t("start_selling_list_7")}</li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ForrSellerPage;
