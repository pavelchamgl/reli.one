import { useSelector } from "react-redux";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";

import styles from "./ProductCharak.module.scss";

const ProductCharak = () => {
  const isMobile = useMediaQuery({ maxWidth: 400 });

  const { t } = useTranslation();

  const { parameters, product_description } = useSelector(
    (state) => state.products.product
  );

  return (
    <div className={styles.main}>
      {isMobile && <p className={styles.mobTitle}>{t("characteristics")}</p>}
      <p className={styles.modelText}>{product_description}</p>

      <div className={styles.totalTable}>
        <div className={styles.blackTitle}>{t("transfer_charac")}</div>

        <div className={styles.tableWrap}>
          {parameters?.map((item, index) => (
            <div key={index} className={styles.tableDiv}>
              <div>
                <p>{item?.parameter_name}</p>
              </div>
              <div>
                <p>{item?.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCharak;
