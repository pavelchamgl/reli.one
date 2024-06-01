import { Dialog } from "@mui/material";

import loginModalXIcon from "../../assets/loginModal/loginModalX.svg";

import styles from "./LoginModal.module.scss";
import AuthInp from "../../ui/AuthInp/AuthInp";
import CheckBox from "../../ui/CheckBox/CheckBox";
import BasketModal from "../Basket/BasketModal/BasketModal";

const LoginModal = ({ open, handleClose }) => {
  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <div className={styles.modal}>
          <div className={styles.modalTitleDiv}>
            <p>Přihlásit se</p>
            <button onClick={handleClose}>
              <img src={loginModalXIcon} alt="" />
            </button>
          </div>

          <div className={styles.mainContentDiv}>
            <div className={styles.mainContentWrap}>
              <label className={styles.inpLabel}>
                <p>Emailová adresa</p>
                <AuthInp type={"text"} />
              </label>
              <label>
                <div className={styles.forgotPassWrap}>
                  <p>Heslo</p>
                  <a className={styles.link} href="#">
                    Zapomenuté heslo
                  </a>
                </div>
                <AuthInp type={"password"} />
              </label>

              <div className={styles.checkDiv}>
                <CheckBox />
                <p>Zůstat přihlášen</p>
              </div>
              <div className={styles.btnDiv}>
                <button className={styles.submitBtn}>Pokračovat</button>
              </div>

              <p className={styles.registerLink}>
                Nemáte účet?
                <a href="#">Zaregistrujte se zde</a>
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LoginModal;
