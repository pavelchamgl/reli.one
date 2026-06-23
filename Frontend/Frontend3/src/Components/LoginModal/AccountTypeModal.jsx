import { Dialog } from "@mui/material";
import { useTranslation } from "react-i18next";

import loginModalXIcon from "../../assets/loginModal/loginModalX.svg";

import styles from "./AccountTypeModal.module.scss";

const AccountTypeModal = ({ open, onClose, onBuyerClick, onSellerClick }) => {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <Dialog open onClose={onClose} keepMounted={false}>
      <div className={styles.modal}>
        <div className={styles.modalTitleDiv}>
          <p>{t("create_an_account")}</p>
          <button type="button" onClick={onClose} aria-label="close">
            <img src={loginModalXIcon} alt="" />
          </button>
        </div>

        <p className={styles.subtitle}>{t("account_type_subtitle")}</p>

        <div className={styles.cardsWrap}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t("buyer_account_title")}</h3>
            <p className={styles.cardDesc}>{t("buyer_account_desc")}</p>
            <button
              type="button"
              className={styles.cardBtn}
              onClick={onBuyerClick}
            >
              {t("register_as_buyer")}
            </button>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t("seller_account_title")}</h3>
            <p className={styles.cardDesc}>{t("seller_account_desc")}</p>
            <button
              type="button"
              className={styles.cardBtn}
              onClick={onSellerClick}
            >
              {t("become_a_seller")}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default AccountTypeModal;
