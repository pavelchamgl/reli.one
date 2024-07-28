import { Dialog } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthNeed } from "../../../ui/Toastify";

import closeIcon from "../../../assets/loginModal/loginModalX.svg";
import BasketModalCard from "../BasketModalCard/BasketModalCard";

import styles from "./BasketModal.module.scss";

const BasketModal = ({ open, handleClose, productData }) => {
  const navigate = useNavigate();

  const { t } = useTranslation();

  const token = localStorage.getItem("token");

  const handleNavigatePayment = () => {
    if (token) {
      navigate("/payment");
    } else {
      AuthNeed(t("toast.auth_required"));
    }
  };

  return (
    <div>
      <Dialog
        maxWidth={"xl"}
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <div className={styles.main}>
          <button onClick={handleClose} className={styles.closeBtn}>
            <img src={closeIcon} alt="" />
          </button>
          <h3 className={styles.title}>{t("basket_modal_title")}</h3>
          <div className={styles.cardAndButtonWrap}>
            <BasketModalCard handleClose={handleClose} data={productData} />
            <div className={styles.buttonDiv}>
              <button onClick={handleNavigatePayment}>{t("go_pay")}</button>
              {/* здесь скорее всего добавление в корзину и закрытие модалки */}
              <button onClick={handleClose}>{t("continue_shopping")}</button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default BasketModal;
