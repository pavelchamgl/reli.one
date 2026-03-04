import { useNavigate } from "react-router-dom";
import { getOnboardingStatus } from "../../../api/seller/onboarding";

import reliLogo from "../../../assets/Header/Logo.svg";

import styles from "./SellerLogo.module.scss";
import { ErrToast } from "../../Toastify";

const SellerLogo = () => {

  const token = localStorage.getItem("token")

  const navigate = useNavigate()

  const handleClick = async () => {
    try {
      const res = await getOnboardingStatus()
      if (res.status === 'approved' && Boolean(token)) {
        navigate('/seller/goods-choice')
      } else {
        ErrToast('Access denied: onboarding not approved.')
      }

    } catch (error) {
      console.log(error);

    }
  }

  return (
    <button type="button" onClick={() => handleClick()} className={styles.linkMain}>
      <img src={reliLogo} alt="logo" />
      <span>/</span>
      <h3>Seller</h3>
    </button>
  );
};

export default SellerLogo;
