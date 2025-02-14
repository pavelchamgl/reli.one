import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";

import styles from "./PreviewCharacteristics.module.scss";

const PreviewCharacteristics = ({ product }) => {
  const isMobile = useMediaQuery({ maxWidth: 400 });

  const { t } = useTranslation();


  const parameters = product?.parameters

  return (
    <div className={styles.main}>
      {isMobile && <p className={styles.mobTitle}>{t("characteristics")}</p>}

      <p>{product?.product_description}</p>

      <div className={styles.totalTable}>
        <div className={styles.blackTitle}>{t("transfer_charac")}</div>

        <div className={styles.tableWrap}>
          {parameters?.map((item, index) => (
            <div key={index} className={styles.tableDiv}>
              <div>
                <p>{item?.name}</p>
              </div>
              <div>
                <p>{item?.value}</p>
              </div>
            </div>
          ))}
          {
            product && product.length &&
            <div className={styles.tableDiv}>
              <div>
                <p>length</p>
              </div>
              <div>
                <p>{product.length} mm</p>
              </div>
            </div>
          }
          {
            product && product.width &&
            <div className={styles.tableDiv}>
              <div>
                <p>width</p>
              </div>
              <div>
                <p>{product.width} mm</p>
              </div>
            </div>
          }
          {
            product && product.height &&
            <div className={styles.tableDiv}>
              <div>
                <p>height</p>
              </div>
              <div>
                <p>{product.height} mm</p>
              </div>
            </div>
          }
          {
            product && product.weight &&
            <div className={styles.tableDiv}>
              <div>
                <p>weight</p>
              </div>
              <div>
                <p>{product.weight} gr</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default PreviewCharacteristics;
