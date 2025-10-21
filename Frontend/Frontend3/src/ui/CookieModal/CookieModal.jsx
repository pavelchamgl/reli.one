import { useRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive"


import styles from "./CookieModal.module.scss";
import { useTranslation } from "react-i18next";

const CookieModal = ({ open, handleClose }) => {
    const dialogRef = useRef(null);

    const isMobile = useMediaQuery({ maxWidth: 500 })

    const { t } = useTranslation()

    const handleAcceptOrReject = (text) => {
        if (text === "reject") {
            localStorage.setItem("cookieSave", JSON.stringify(false))
        } else {
            localStorage.setItem("cookieSave", JSON.stringify(true))
        }
        handleClose()
        window.location.reload()
    }

    useEffect(() => {
        if (open) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [open]);

    const handleDialogClick = (e) => {
        // Проверяем, был ли клик на самом элементе <dialog>
        if (e.target === dialogRef.current) {
            handleClose();
            localStorage.setItem("cookieSave", JSON.stringify(false))
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className={styles.modal}
            onClick={handleDialogClick}
        >
            <div className={styles.content}>
                <h3 className={styles.title}>{t("cookiesTitle")}</h3>
                <p className={styles.desc}>{t("cookiesDesc")}</p>

                {isMobile ?
                    <div className={styles.mMainWrapBtn}>
                        <div className={styles.mobileBtnWrap}>
                            <button onClick={() => handleAcceptOrReject("reject")}>{t("rejectAll")}</button>
                            <button onClick={() => handleAcceptOrReject("accept")}>{t("acceptAll")}</button>
                        </div>
                        <button className={styles.customMobile}>{t("customize")}</button>
                    </div>
                    :
                    <div className={styles.btnsDiv}>
                        <button onClick={() => handleAcceptOrReject("reject")}>{t("rejectAll")}</button>
                        <button>{t("customize")}</button>
                        <button onClick={() => handleAcceptOrReject("accept")}>{t("acceptAll")}</button>
                    </div>
                }
            </div>
        </dialog >
    );
};

export default CookieModal;
