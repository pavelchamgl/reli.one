import { Link, useLocation } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import SellerLogo from "../../../ui/Seller/sellerLogo/SellerLogo";
import profileIcon from "../../../assets/Header/profileIcon.svg";
import { useTranslation } from "react-i18next";
import styles from "./SellerHeader.module.scss";
import SellerTab from "../../../ui/Seller/sellerTab/SellerTab";
import { sellerPathnames } from "../../../code/seller";

const SellerHeader = () => {
  const { t } = useTranslation();

  const mobile = useMediaQuery({ maxWidth: 500 })

  const { pathname } = useLocation()

  




  return (
    <div className={styles.main}>
      <div className={styles.sellerHeaderTop}>
        <SellerLogo />

        {
          !mobile
          &&
          <Link to={"#"} className={styles.loginItem}>
            <img src={profileIcon} alt="" />
            <p>{t("enter_account")}</p>
          </Link>
        }

      </div>
      {
        !mobile && !sellerPathnames.includes(pathname) &&
        < SellerTab />
      }
    </div>
  );
};

export default SellerHeader;
