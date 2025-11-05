import { useRef, useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive"
import { Dialog } from "@mui/material";

import xIcon from "../../assets/loginModal/loginModalX.svg"

import styles from "./PolicySettingsModal.module.scss";
import PolicySwitch from "../PolicySwitch/PolicySwitch";
import { t } from "i18next";
import CookiLangToogle from "../cookie/CookieLangToggle/CookiLangToogle";

const TextBlock = ({ title, desc }) => {
    return (
        <div className={styles.introBlock}>
            <h3 >{title}</h3>
            <p >{desc}</p>
        </div >
    )
}

const PolicySettingsModal = ({ open, handleClose, parrentHandleClose }) => {

    const isMobile = useMediaQuery({ maxWidth: 500 })

    const saveCookie = localStorage.getItem("cookieSave")
    const preferences = localStorage.getItem("preferences")
    const marketing = localStorage.getItem("marketing")

    const [saveAnalytics, setSaveAnalytics] = useState(
        saveCookie ? JSON.parse(saveCookie) : false
    );

    const [savePreferenses, setSavePreferenses] = useState(
        preferences ? JSON.parse(preferences) : false
    )

    const [saveMarketing, setSaveMarketing] = useState(
        marketing ? JSON.parse(marketing) : false
    )






    const handleSave = () => {
        localStorage.setItem("cookieSave", JSON.stringify(saveAnalytics));
        localStorage.setItem("preferences", JSON.stringify(savePreferenses));
        localStorage.setItem("marketing", JSON.stringify(saveMarketing));

        // Если пользователь запретил preferences — сбрасываем язык в дефолтный (например, cs)
        if (!savePreferenses) {
            localStorage.setItem("i18nextLng", "en");
        }

        window.reliConsentCustom?.({
            analytics: saveAnalytics,
            ads: saveMarketing,
            personalization: savePreferenses,
        });

        handleClose();
        parrentHandleClose?.();
        setTimeout(() => {
            window.location.reload();
        }, 800);
    };


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

                <div className={styles.closeBtnWrap}>
                    <CookiLangToogle />
                    <button onClick={handleClose} >
                        <img src={xIcon} alt="" />
                    </button>
                </div>

                <div className={styles.textBlocksWrap}>
                    <TextBlock title={t("cookiePrefTitle")}
                        desc={t("privacySettingsDesc")} />

                    <div>
                        <h3 className={styles.title}>{t("esential.title")}</h3>
                        <div className={styles.blockWithSwitch}>
                            <p className={styles.desc}>{t("esential.desc")}</p>
                            <PolicySwitch checked={true} setChecked={() => { }} />
                        </div>
                    </div>

                    <div>
                        <h3 className={styles.title}>{t("analytics.title")}</h3>
                        <div className={styles.blockWithSwitch}>
                            <p className={styles.desc}>{t("analytics.desc")}</p>
                            <PolicySwitch checked={saveAnalytics} setChecked={setSaveAnalytics} />
                        </div>
                    </div>

                    <div>
                        <h3 className={styles.title}>{t("functional.title")}</h3>
                        <div className={styles.blockWithSwitch}>
                            <p className={styles.desc}>{t("functional.desc")}</p>
                            <PolicySwitch checked={savePreferenses} setChecked={setSavePreferenses} />
                        </div>
                    </div>

                    <div>
                        <h3 className={styles.title}>{t("marketing.title")}</h3>
                        <div className={styles.blockWithSwitch}>
                            <p className={styles.desc}>{t("marketing.desc")}</p>
                            <PolicySwitch checked={saveMarketing} setChecked={setSaveMarketing} />
                        </div>
                    </div>
                </div>


                <div className={styles.btnsDiv}>
                    <button onClick={() => handleClose()}>{t("cancel")}</button>
                    <button onClick={() => handleSave()}>{t("confirm_choice")}</button>
                </div>

            </div>
        </Dialog >
    );
};

export default PolicySettingsModal;
