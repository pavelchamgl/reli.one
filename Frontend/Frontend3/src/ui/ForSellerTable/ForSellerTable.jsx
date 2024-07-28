import { useTranslation } from "react-i18next";

import styles from "./ForSellerTable.module.scss";

const ForSellerTable = () => {
  const { t } = useTranslation();

  return (
    <div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_gadgets")}</p>
        </div>
        <div>
          <p>8%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_baby")}</p>
        </div>
        <div>
          <p>10%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_bags")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_beauty")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_clothing")}</p>
        </div>
        <div>
          <p>11%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_computers")}</p>
        </div>
        <div>
          <p>8%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_electronics")}</p>
        </div>
        <div>
          <p>8%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_furniture")}</p>
        </div>
        <div>
          <p>12%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_home")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableBigItem}>
        <div className={styles.forBigTableDiv}>
          <p>{t("table_jewerly")}</p>
        </div>
        <div className={styles.forBigTableDiv}>
          <div>
            <p>{t("table_price_text_1")}</p>
            <p>250$</p>
            <p>{t("table_price_text_2")}</p>
            <p>250$</p>
          </div>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_garden")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_office")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_pets")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_sports")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>{t("table_toys")}</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableBigItem}>
        <div className={styles.forBigTableDiv}>
          <p>{t("table_watches")}</p>
        </div>
        <div className={styles.forBigTableDiv}>
          <div>
            <p>{t("table_price_text_1")}</p>
            <p>1500$</p>
            <p>{t("table_price_text_2")}</p>
            <p>1500$</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForSellerTable;
