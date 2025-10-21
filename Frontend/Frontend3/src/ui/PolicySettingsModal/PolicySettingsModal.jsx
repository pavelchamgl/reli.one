import { useRef, useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive"

import xIcon from "../../assets/loginModal/loginModalX.svg"

import styles from "./PolicySettingsModal.module.scss";
import PolicySwitch from "../PolicySwitch/PolicySwitch";
import { t } from "i18next";

const TextBlock = ({ title, desc }) => {
    return (
        <div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.desc}>{desc}</p>
        </div >
    )
}

const PolicySettingsModal = ({ open, handleClose }) => {
    const dialogRef = useRef(null);

    const isMobile = useMediaQuery({ maxWidth: 500 })

    const saveCookie = localStorage.getItem("cookieSave")
    const preferences = localStorage.getItem("preferences")

    const [saveAnalytics, setSaveAnalytics] = useState(
        saveCookie ? JSON.parse(saveCookie) : false
    );

    const [savePreferenses, setSavePreferenses] = useState(
        preferences ? JSON.parse(preferences) : false
    )




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

        }
    };

    const handleAccept = () => {
        localStorage.setItem("preferences", JSON.stringify(true))
        localStorage.setItem("cookieSave", JSON.stringify(true))
        setSaveAnalytics(true)
        setSavePreferenses(true)
        handleClose()
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }

    const handleReject = () => {
        localStorage.setItem("preferences", JSON.stringify(false))
        localStorage.setItem("cookieSave", JSON.stringify(false))
        setSaveAnalytics(false)
        setSavePreferenses(false)
        handleClose()
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }

    const handleSave = () => {
        if (saveAnalytics) {
            localStorage.setItem("cookieSave", JSON.stringify(true))
        } else {
            localStorage.setItem("cookieSave", JSON.stringify(false))
        }

        if (savePreferenses) {
            localStorage.setItem("preferences", JSON.stringify(true))
        } else {
            localStorage.setItem("preferences", JSON.stringify(false))
        }

        handleClose()
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }



    return (
        <dialog
            ref={dialogRef}
            className={styles.modal}
            onClick={handleDialogClick}
        >
            <div className={styles.content}>
                <button onClick={handleClose} className={styles.closeBtn}>
                    <img src={xIcon} alt="" />
                </button>
                <div className={styles.textBlocksWrap}>
                    <TextBlock title={t("privacySettings")}
                        desc={t("privacySettingsDesc")} />
                    <TextBlock title={t("strictlyNecessary")}
                        desc={t("strictlyNecessaryDesc")} />

                    <div>
                        <h3 className={styles.title}>{t("preferences")}</h3>
                        <div className={styles.blockWithSwitch}>
                            <p className={styles.desc}>{t("preferencesDesc")}</p>
                            <PolicySwitch checked={savePreferenses} setChecked={setSavePreferenses} />
                        </div>
                    </div>

                    <div>
                        <h3 className={styles.title}>{t("analytics")}</h3>
                        <div className={styles.blockWithSwitch}>
                            <p className={styles.desc}>{t("analyticsDesc")}</p>
                            <PolicySwitch checked={saveAnalytics} setChecked={setSaveAnalytics} />
                        </div>
                    </div>

                </div>

                {isMobile ?
                    <div className={styles.mMainWrapBtn}>
                        <div className={styles.mobileBtnWrap}>
                            <button onClick={() => handleReject()}>{t("rejectAll")}</button>
                            <button onClick={() => handleAccept()}>{t("acceptAll")}</button>
                        </div>
                        <button className={styles.customMobile} onClick={() => handleSave()}>Save</button>
                    </div>
                    :
                    <div className={styles.btnsDiv}>
                        <button onClick={() => handleReject()}>{t("rejectAll")}</button>
                        <button onClick={() => handleSave()}>Save</button>
                        <button onClick={() => handleAccept()}>{t("acceptAll")}</button>
                    </div>
                }
            </div>
        </dialog >
    );
};

export default PolicySettingsModal;
