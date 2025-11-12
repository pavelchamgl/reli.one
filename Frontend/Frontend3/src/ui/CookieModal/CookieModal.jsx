import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useTranslation } from "react-i18next";
import PolicySettingsModal from "../PolicySettingsModal/PolicySettingsModal";
import { Link } from "react-router-dom"

import { Dialog } from "@mui/material";

import styles from "./CookieModal.module.scss";
import CookiLangToogle from "../cookie/CookieLangToggle/CookiLangToogle";


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
        localStorage.setItem("marketing", "false");
      } else {
        // ✅ Принять всё
        window.reliConsentAccept?.();
        localStorage.setItem("cookieSave", "true");
        localStorage.setItem("preferences", "true");
        localStorage.setItem("marketing", "true");

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
          maxWidth: { xs: "93%", sm: "744px" }, // ← адаптивная ширина
          margin: "0 auto",
          padding: "0"
        },
      }}

    >
      <div className={styles.content}>
        <div className={styles.langToggleWrap}>
          <CookiLangToogle />
        </div>
        <h3 className={styles.title}>{t("cookiesTitle")}</h3>
        <div className={styles.descWrap}>
          <p className={styles.desc}>{t("cookiesDesc.first")}</p>
          <p className={styles.desc}>{t("cookiesDesc.second")}</p>
          <p className={styles.desc}>{t("cookiesDesc.third")}</p>
          <p className={styles.desc}>{t("cookiesDesc.fourth")}</p>
        </div>

        <p className={`${styles.desc} ${styles.linkText}`} >
          {t("policyLinkText.read")}{" "}
          <Link to={"/cookie-policy"} onClick={() => handleClose()} >
            {t("policyLinkText.cookiePolicy")}
          </Link>
          {t("policyLinkText.and")}
          <Link to={"/privacy-policy"} onClick={() => handleClose()} >
            {t("privacyPolicyPageTitle")}
          </Link>
        </p>

        {isMobile ? (
          <div className={styles.mMainWrapBtn}>
            <button onClick={() => handleAcceptOrReject("accept")}>
              {t("acceptAll")}
            </button>
            <button onClick={() => handleAcceptOrReject("reject")}>
              {t("rejectAll")}
            </button>
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
