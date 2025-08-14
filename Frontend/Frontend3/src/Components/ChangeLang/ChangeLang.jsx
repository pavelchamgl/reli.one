import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Drawer } from "@mui/material"

import { useWindowSize } from '../../hook/useWindowSize';
import enIcon from "../../assets/lang/en.svg";
import csIcon from "../../assets/lang/cs.svg";
import checkMark from "../../assets/lang/checkMark.svg";
import closeIcon from "../../assets/lang/closeIcon.svg";

import styles from "./ChangeLang.module.css"


const ModalAndDrawerContent = ({ lang, handleChangeLang }) => {
    return (
        <>
            <h4 className='font-semibold text-xl'>Choose a language</h4>
            <button onClick={() => handleChangeLang('en')} className="w-[100%] flex items-center justify-between gap-2 h-10 px-2 rounded-full bg-white transition hover:bg-gray-300">
                <div className="flex items-center gap-2">
                    <img className="w-5" src={enIcon} alt="English" />
                    <span>English</span>
                </div>
                {
                    lang === "en" && <img src={checkMark} alt="" />
                }
            </button>
            <button onClick={() => handleChangeLang('cz')} className="w-[100%] flex items-center justify-between gap-2 h-10 px-2 rounded-full bg-white transition hover:bg-gray-300">
                <div className='flex items-center gap-2'>
                    <img className="w-5" src={csIcon} alt="Czech" />
                    <span>Czech</span>
                </div>
                {
                    lang === "cz" && <img src={checkMark} alt="" />
                }
            </button>
        </>
    )
}




const ChangeLang = () => {
    const [open, setOpen] = useState(false);
    const { i18n } = useTranslation();
    const dropdownRef = useRef(null);

    const { width, height } = useWindowSize();

    const handleChangeLang = (lang) => {
        i18n.changeLanguage(lang);
        setOpen(false); // Закрываем после выбора языка
    };

    const lang = i18n.language



    // Закрытие при клике вне компонента
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
                <img className="w-5" src={lang === "en" ? enIcon : csIcon} alt="" />
                <p className="font-medium text-xl">{lang === "en" ? "En" : "Cz"}</p>
            </button >
            {open &&
                width > 426 ?

                (
                    <div ref={dropdownRef} className={styles.modal}>
                        <ModalAndDrawerContent lang={lang} handleChangeLang={handleChangeLang} />
                    </div>
                )
                :
                <Drawer
                    open={open}
                    onClose={() => setOpen(false)}
                    anchor='bottom'
                >
                    <div className={styles.drawerWrap}>
                        <button onClick={() => setOpen(false)} className={styles.closeBtn}>
                            <img src={closeIcon} alt="" />
                        </button>
                        <ModalAndDrawerContent lang={lang} handleChangeLang={handleChangeLang} />
                    </div>
                </Drawer>
            }
        </>
    );
};

export default ChangeLang;
