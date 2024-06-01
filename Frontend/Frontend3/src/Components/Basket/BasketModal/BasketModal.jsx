import { Dialog } from "@mui/material";
import BasketCard from "../BasketCard/BasketCard";
import closeIcon from "../../../assets/loginModal/loginModalX.svg";

import styles from "./BasketModal.module.scss";

const BasketModal = ({ open, handleClose }) => {
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
          <h3 className={styles.title}>Zboží přidáno do košíku</h3>
          <div className={styles.cardAndButtonWrap}>
            <BasketCard />
            <div className={styles.buttonDiv}>
              <button>Přejít na návrh</button>
              <a href="#">Pokračovat v nákupu</a>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default BasketModal;
