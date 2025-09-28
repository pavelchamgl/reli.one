import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";

import styles from "./ProductCharak.module.scss";
import ProductAdditionalDetails from "../productAdditionalDetails/ProductAdditionalDetails";

const ProductCharak = () => {
  const isMobile = useMediaQuery({ maxWidth: 500 });

  const { t } = useTranslation();

  const { product_parameters, product_description, license_file, additional_details } = useSelector(
    (state) => state.products.product
  );


  const [formattedText, setFormattedText] = useState(product_description || "");

  useEffect(() => {
    if (!product_description) return;

    const replacedText = product_description?.split(/(\d+)/).map((part, index) =>
      /\d+/.test(part) ? <span key={index}>{part}</span> : part
    );

    setFormattedText(replacedText);
  }, [product_description]);

  const unitMap = {
    length: "mm",
    width: "mm",
    height: "mm",
    weight: "g",
    Length: "mm",
    Width: "mm",
    Height: "mm",
    Weight: "g"
  };

  return (
    <div className={styles.main}>
      {isMobile && <p className={styles.mobTitle}>{t("characteristics")}</p>}
      <pre className={styles.modelText}>{formattedText}</pre>


      {
        additional_details &&
        <ProductAdditionalDetails detail={additional_details} />

      }

      {isMobile && <p className={styles.charackTitle}>{t("prod_charack")}</p>}
      <div className={styles.totalTable}>
        <div className={styles.blackTitle}>{t("transfer_charac")}</div>

        <div className={styles.tableWrap}>
          {product_parameters?.map((item, index) => (
            <div key={index} className={styles.tableDiv}>
              <div>
                <p>{item?.name}</p>
              </div>
              <div>
                <p className={styles.valueText}>
                  {item?.name && unitMap[item.name] ? `${item.value} ${unitMap[item.name]}` : item?.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {license_file && <p className={styles.licenseText}>View certificate <a href={license_file}>here</a></p>}
    </div>
  );
};

export default ProductCharak;
