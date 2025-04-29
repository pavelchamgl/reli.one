import { Dialog } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AuthNeed } from "../../../ui/Toastify";
import {
  deselectAllProducts,
  selectProduct,
  updateTotalPrice,
} from "../../../redux/basketSlice";
import closeIcon from "../../../assets/loginModal/loginModalX.svg";
import BasketModalCard from "../BasketModalCard/BasketModalCard";

import styles from "./BasketModal.module.scss";
import { useState } from "react";

const BasketModal = ({ open, handleClose, productData}) => {
  const [count, setCount] = useState(0);

  console.log(productData);


  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const token = localStorage.getItem("token");

  const handleNavigatePayment = () => {
    if (token) {
      dispatch(deselectAllProducts());
      dispatch(selectProduct({ sku: productData.sku, selected: true }));
      dispatch(updateTotalPrice());
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
            <BasketModalCard
              setMainCount={setCount}
              handleClose={handleClose}
              data={productData}
            />
            <div className={styles.buttonDiv}>
              <button disabled={!count} onClick={handleNavigatePayment}>
                {t("go_pay")}
              </button>
              <button onClick={handleClose}>{t("continue_shopping")}</button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default BasketModal;
