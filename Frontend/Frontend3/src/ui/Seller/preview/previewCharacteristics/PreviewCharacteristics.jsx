import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";

import styles from "./PreviewCharacteristics.module.scss";

const PreviewCharacteristics = () => {
  const isMobile = useMediaQuery({ maxWidth: 400 });

  const { t } = useTranslation();

  const product_description = "Header";

  const parameters = [
    {
      parameter_name: "massa",
      value: "5g",
    },
    {
      parameter_name: "width",
      value: "100m",
    },
    {
      parameter_name: "height",
      value: "200m",
    },
  ];

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

export default PreviewCharacteristics;
