import { Container } from "@mui/material";
import { useState } from "react";

import ProductTab from "../../../Product/ProductTab/ProductTab";
import PreviewImage from "../../../../ui/Seller/preview/previewImages/PreviewImage";
import PreviewProductNameRate from "../../../../ui/Seller/preview/previewProductNameRates/PreviewProductNameRate";

import styles from "./SellerPreviewDesktop.module.scss";
import PreviewCharacteristics from "../../../../ui/Seller/preview/previewCharacteristics/PreviewCharacteristics";

const SellerPreviewDesktop = () => {
  const [section, setSection] = useState("Charakteristika");

  return (
    <div style={{ margin: "27px 0 0" }}>
      <div className={styles.main}>
        <div className={styles.imageRateDiv}>
          <PreviewImage />
          <PreviewProductNameRate />
        </div>
        <ProductTab setTab={setSection} />
        <PreviewCharacteristics />
      </div>
    </div>
  );
};

export default SellerPreviewDesktop;
