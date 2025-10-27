import { useRef, useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import PolicySettingsModal from "../PolicySettingsModal/PolicySettingsModal";

import { Dialog } from "@mui/material";

import styles from "./CookieModal.module.scss";


const CookieModal = ({ open, handleClose }) => {
  const isMobile = useMediaQuery({ maxWidth: 500 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useTranslation();



  const handleAcceptOrReject = (type) => {
    try {
      if (type === "reject") {
        // ❌ Отклонить всё
        window.reliConsentReject?.();
        localStorage.setItem("cookieSave", "false");
        localStorage.setItem("preferences", "false");
      } else {
        // ✅ Принять всё
        window.reliConsentAccept?.();
        localStorage.setItem("cookieSave", "true");
        localStorage.setItem("preferences", "true");
      }
    } catch (err) {
      console.warn("Consent error:", err);
    } finally {
      handleClose();
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  };


  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick") return; // ← блокируем клик по фону
        handleClose();
      }}
      disableEscapeKeyDown

      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: { xs: "93%", sm: "500px" }, // ← адаптивная ширина
          margin: "0 auto",
        },
      }}

    >
      <div className={styles.content}>
        <h3 className={styles.title}>{t("cookiesTitle")}</h3>
        <div className={styles.descWrap}>
          <p className={styles.desc}>{t("cookiesDesc.first")}</p>
          <p className={styles.desc}>{t("cookiesDesc.second")}</p>
        </div>

        {isMobile ? (
          <div className={styles.mMainWrapBtn}>
            <div className={styles.mobileBtnWrap}>
              <button onClick={() => handleAcceptOrReject("reject")}>
                {t("rejectAll")}
              </button>
              <button onClick={() => handleAcceptOrReject("accept")}>
                {t("acceptAll")}
              </button>
            </div>
            <button
              className={styles.customMobile}
              onClick={() => setSettingsOpen(true)}
            >
              {t("customize")}
            </button>
          </div>
        ) : (
          <div className={styles.btnsDiv}>
            <button onClick={() => handleAcceptOrReject("reject")}>
              {t("rejectAll")}
            </button>
            <button onClick={() => setSettingsOpen(true)}>
              {t("customize")}
            </button>
            <button onClick={() => handleAcceptOrReject("accept")}>
              {t("acceptAll")}
            </button>
          </div>
        )}
      </div>

      <PolicySettingsModal
        open={settingsOpen}
        handleClose={() => setSettingsOpen(false)}
        parrentHandleClose={handleClose}
      />
    </Dialog>
  );
};

export default CookieModal;
