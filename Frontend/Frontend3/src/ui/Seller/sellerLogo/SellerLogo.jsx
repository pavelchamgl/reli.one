import { Link } from "react-router-dom";

import reliLogo from "../../../assets/Header/Logo.svg";

import styles from "./SellerLogo.module.scss";

const SellerLogo = () => {
  return (
    <Link className={styles.linkMain} to={"/seller-good"}>
      <img src={reliLogo} alt="logo" />
      <span>/</span>
      <h3>Seller</h3>
    </Link>
  );
};

export default SellerLogo;
