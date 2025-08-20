import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Drawer } from "@mui/material";

import { useWindowSize } from '../../hook/useWindowSize';
import enIcon from "../../assets/lang/en.svg";
import csIcon from "../../assets/lang/cs.svg";
import checkMark from "../../assets/lang/checkMark.svg";
import closeIcon from "../../assets/lang/closeIcon.svg";

import styles from "./ChangeLang.module.css";

const ModalAndDrawerContent = ({ lang, handleChangeLang }) => {
    const { t } = useTranslation()
    return (
        <>
            <h4 className={styles.modalTitle}>{t("choose_lang")}</h4>
            <div className={styles.langBtns}>
                <button
                    onClick={() => handleChangeLang('en')}
                    className={`${styles.langOption} ${lang === "en" ? styles.active : ""}`}
                >
                    <div className={styles.langInfo}>
                        <img className={styles.optionLangIcon} src={enIcon} alt="English" />
                        <span>English</span>
                    </div>
                    {lang === "en" && <img src={checkMark} alt="" />}
                </button>

                <button
                    onClick={() => handleChangeLang('cz')}
                    className={`${styles.langOption} ${lang === "cz" ? styles.active : ""}`}
                >
                    <div className={styles.langInfo}>
                        <img className={styles.optionLangIcon} src={csIcon} alt="Czech" />
                        <span>Česky</span>
                    </div>
                    {lang === "cz" && <img src={checkMark} alt="" />}
                </button>
            </div>
        </>
    );
};

const ChangeLang = () => {
    const [open, setOpen] = useState(false);
    const { i18n } = useTranslation();
    const dropdownRef = useRef(null);

    const { width } = useWindowSize();

    const handleChangeLang = (lang) => {
        i18n.changeLanguage(lang);
        setOpen(false);
    };

    const lang = i18n.language;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <>
            <button onClick={() => setOpen(!open)} className={styles.langBtn}>
                <img className={styles.langIcon} src={lang === "en" ? enIcon : csIcon} alt="" />
                <p className={styles.langLabel}>{lang === "en" ? "English" : "Česky"}</p>
            </button>

            {open && (
                width > 426 ? (
                    <div ref={dropdownRef} className={styles.modal}>
                        <ModalAndDrawerContent lang={lang} handleChangeLang={handleChangeLang} />
                    </div>
                ) : (
                    <Drawer open={open} onClose={() => setOpen(false)} anchor='bottom'>
                        <div className={styles.drawerWrap}>
                            <button onClick={() => setOpen(false)} className={styles.closeBtn}>
                                <img src={closeIcon} alt="" />
                            </button>
                            <ModalAndDrawerContent lang={lang} handleChangeLang={handleChangeLang} />
                        </div>
                    </Drawer>
                )
            )}
        </>
    );
};

export default ChangeLang;
