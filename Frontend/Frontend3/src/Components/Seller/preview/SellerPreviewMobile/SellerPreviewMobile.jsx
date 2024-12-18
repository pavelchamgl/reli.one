import PreviewCharacteristics from "../../../../ui/Seller/preview/previewCharacteristics/PreviewCharacteristics";
import PreviewImageAndName from "../../../../ui/Seller/preview/previewImageAndName/PreviewImageAndName";
import PreviewMobileSwitch from "../../../../ui/Seller/preview/previewMobileSwitch/PreviewMobileSwitch";
import SellerPageContainer from "../../../../ui/Seller/SellerPageContainer/SellerPageContainer";

import styles from "./SellerPreviewMobile.module.scss";

const SellerPreviewMobile = () => {
  return (
    <SellerPageContainer>
      <div className={styles.main}>
        <PreviewImageAndName />
        <PreviewMobileSwitch />
      </div>
      <PreviewCharacteristics />
    </SellerPageContainer>
  );
};

export default SellerPreviewMobile;
