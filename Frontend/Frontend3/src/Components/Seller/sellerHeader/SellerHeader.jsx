import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

import SellerLogo from "../../../ui/Seller/sellerLogo/SellerLogo";
import profileIcon from "../../../assets/Header/profileIcon.svg";
import { useTranslation } from "react-i18next";
import { sellerPathnames } from "../../../code/seller";
import SellerTab from "../../../ui/Seller/sellerTab/SellerTab";

import styles from "./SellerHeader.module.scss";
import ChangeLang from "../all/ChangeLang/ChangeLang";
import { logout } from "../../../api/auth";

const SellerHeader = () => {
  const { t } = useTranslation();

  const mobile = useMediaQuery({ maxWidth: 500 })

  const { pathname } = useLocation()
  const navigate = useNavigate()

  const token = JSON.parse(localStorage.getItem("token")) || {}


  const handleLogout = () => {
    logout({ refresh_token: token?.refresh }).then((res) => {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      navigate('/seller/login')
      window.location.reload();
    });
  };


  return (
    <div className={styles.main}>
      <div className={styles.sellerHeaderTop}>
        <SellerLogo />

        <div className={styles.langAndLogin}>

          {
            !mobile ? (
              Object.keys(token).length > 0 ? (
                <button onClick={handleLogout} className={styles.loginItem}>
                  <img src={profileIcon} alt="" />
                  <p>Logout</p>
                </button>
              ) : (
                <Link to={"/seller/login"} className={styles.loginItem}>
                  <img src={profileIcon} alt="" />
                  <p>{t("enter_account")}</p>
                </Link>
              )
            )
              :
              null
          }
          <ChangeLang />
        </div>


      </div>
      {
        !mobile && !sellerPathnames.includes(pathname) &&
        < SellerTab />
      }
    </div>
  );
};

export default SellerHeader;
