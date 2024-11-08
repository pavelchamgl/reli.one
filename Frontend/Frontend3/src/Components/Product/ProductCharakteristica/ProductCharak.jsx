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
          {/* <div className={styles.tableDiv}>
            <div>
              <p>Voc</p>
            </div>
            <div>
              <p>23.76V</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Isc</p>
            </div>
            <div>
              <p>11.11A</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Vmp</p>
            </div>
            <div>
              <p>19.8V</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Imp</p>
            </div>
            <div>
              <p>10.1A</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Účinnost</p>
            </div>
            <div>
              <p>21.6%</p>
            </div>
          </div>

          <div className={styles.tableDiv}>
            <div>
              <p>Tolerance</p>
            </div>
            <div>
              <p>0~+5W</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Maximální napětí systému</p>
            </div>
            <div>
              <p>1500V DC</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Tlak větru/sněhu</p>
            </div>
            <div>
              <p>2400mpa/5400mpa</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.totalTable}>
        <div className={styles.blackTitle}>{t("structural_property")}</div>

        <div className={styles.tableWrap}>
          <div className={styles.tableDiv}>
            <div>
              <p>Rozměr</p>
            </div>
            <div>
              <p>1065mm*1045mm</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Tloušťka</p>
            </div>
            <div>
              <p>3mm</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Weight</p>
            </div>
            <div>
              <p>3.8kg</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Článek</p>
            </div>
            <div>
              <p>Mono166*166mm, 36ks (6*6)</p>
            </div>
          </div>
          <div className={styles.tableDiv}>
            <div>
              <p>Propojovací skříňka</p>
            </div>
            <div>
              <p>IP68 (3 bypassové diody), konektory kompatibilní s MC4</p>
            </div>
          </div> */}
          {/* <div className={styles.tableDiv}>
            <div>
              <p>Konektor</p>
            </div>
            <div>
              <p>
                44,0 mm² (IEC) Délka vodiče: (+)250 mm, (-)350mm, délku vodiče
                lze upravit na míru
              </p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ProductCharak;
