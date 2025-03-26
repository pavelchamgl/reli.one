import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import styles from "./PreviewCharacteristics.module.scss";

const PreviewCharacteristics = ({ product }) => {
  const isMobile = useMediaQuery({ maxWidth: 400 });
  const [parameters, setParameters] = useState([])
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")


  const { t } = useTranslation();

  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.includes("edit")) {
      setParameters(product?.parameters)
      setLength(product?.length)
      setWidth(product?.width)
      setHeight(product?.height)
      setWeight(product?.weight)
    } else {
      setParameters(product?.product_parameters)
      setLength(product?.lengthMain)
      setHeight(product?.heightMain)
      setWeight(product?.weightMain)
      setWidth(product?.widthMain)
    }

  }, [pathname])



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
            product && length &&
            <div className={styles.tableDiv}>
              <div>
                <p>Length</p>
              </div>
              <div>
                <p>{length} mm</p>
              </div>
            </div>
          }
          {
            product && width &&
            <div className={styles.tableDiv}>
              <div>
                <p>Width</p>
              </div>
              <div>
                <p>{width} mm</p>
              </div>
            </div>
          }
          {
            product && height &&
            <div className={styles.tableDiv}>
              <div>
                <p>Height</p>
              </div>
              <div>
                <p>{height} mm</p>
              </div>
            </div>
          }
          {
            product && weight &&
            <div className={styles.tableDiv}>
              <div>
                <p>Weight</p>
              </div>
              <div>
                <p>{weight} gr</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default PreviewCharacteristics;
