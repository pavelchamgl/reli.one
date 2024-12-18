import { Link } from "react-router-dom";

import SellerLogo from "../../../ui/Seller/sellerLogo/SellerLogo";
import profileIcon from "../../../assets/Header/profileIcon.svg";
import { useTranslation } from "react-i18next";
import styles from "./SellerHeader.module.scss";
import SellerTab from "../../../ui/Seller/sellerTab/SellerTab";

const SellerHeader = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.main}>
      <div className={styles.sellerHeaderTop}>
        <SellerLogo />

        <Link to={"#"} className={styles.loginItem}>
          <img src={profileIcon} alt="" />
          <p>{t("enter_account")}</p>
        </Link>
      </div>
      <SellerTab />
    </div>
  );
};

export default SellerHeader;
