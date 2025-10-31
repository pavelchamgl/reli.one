import { useRef, useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive"
import { Dialog } from "@mui/material";

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

const PolicySettingsModal = ({ open, handleClose, parrentHandleClose }) => {

    const isMobile = useMediaQuery({ maxWidth: 500 })

    const saveCookie = localStorage.getItem("cookieSave")
    const preferences = localStorage.getItem("preferences")

    const [saveAnalytics, setSaveAnalytics] = useState(
        saveCookie ? JSON.parse(saveCookie) : false
    );

    const [savePreferenses, setSavePreferenses] = useState(
        preferences ? JSON.parse(preferences) : false
    )


    const handleAccept = () => {

        window.reliConsentAccept?.();

        localStorage.setItem("preferences", JSON.stringify(true))
        localStorage.setItem("cookieSave", JSON.stringify(true))

        localStorage.setItem("i18nextLng", "en")

        setSaveAnalytics(true)
        setSavePreferenses(true)

        handleClose()
        parrentHandleClose?.()
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }

    const handleReject = () => {
        window.reliConsentReject?.();


        localStorage.setItem("preferences", JSON.stringify(false))
        localStorage.setItem("cookieSave", JSON.stringify(false))


        localStorage.removeItem("i18nextLng")

        setSaveAnalytics(false)
        setSavePreferenses(false)
        handleClose()
        parrentHandleClose?.()
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
            localStorage.setItem("i18nextLng", "en")
        } else {
            localStorage.setItem("preferences", JSON.stringify(false))
            localStorage.removeItem("i18nextLng")
        }

        window.reliConsentCustom?.({
            analytics: saveAnalytics,            // ← из твоего состояния
            ads: false,                          // у тебя, видимо, рекламы нет
            personalization: savePreferenses     // ← из твоего состояния
        });

        handleClose()
        parrentHandleClose?.()
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }



    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                handleClose();
            }}
            maxWidth={"xl"}

            PaperProps={{
                sx: {
                    width: "100%",
                    maxWidth: { xs: "93%", sm: "648px" }, // ← адаптивная ширина
                    margin: "0 auto",
                },
            }}


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
                        <button className={styles.customMobile} onClick={() => handleSave()}>{t("saveChoices")}</button>
                    </div>
                    :
                    <div className={styles.btnsDiv}>
                        <button onClick={() => handleReject()}>{t("rejectAll")}</button>
                        <button onClick={() => handleAccept()}>{t("acceptAll")}</button>
                        <button onClick={() => handleSave()}>{t("saveChoices")}</button>
                    </div>
                }
            </div>
        </Dialog >
    );
};

export default PolicySettingsModal;
