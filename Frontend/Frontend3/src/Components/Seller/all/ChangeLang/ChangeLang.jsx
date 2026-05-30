import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';

import langIc from "../../../../assets/Seller/all/langIc.svg";
import styles from "./ChangeLang.module.css";

const LANGUAGES = [
  { code: 'cz', label: 'Česky' },
  { code: 'en', label: 'English' },
];

const DropdownContent = ({ lang, onSelect }) => (
  <>
    {LANGUAGES.map(({ code, label }) => (
      <button
        key={code}
        onClick={() => onSelect(code)}
        className={styles.langOption}
        type="button"
      >
        <div className={`${styles.radio} ${lang === code ? styles.radioAct : ''}`} />
        <span className={lang === code ? styles.activeLabel : ''}>{label}</span>
      </button>
    ))}
  </>
);

const ChangeLang = () => {
  const [open, setOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const wrapperRef = useRef(null);
  const lang = i18n.language;

  const handleChangeLang = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={styles.langBtn}
        aria-expanded={open}
      >
        <img className={styles.langIcon} src={langIc} alt="" />
        <p className={styles.langLabel}>{t('choose_lang')}</p>
      </button>

      {open && (
        <div className={styles.modal} role="listbox">
          <DropdownContent lang={lang} onSelect={handleChangeLang} />
        </div>
      )}
    </div>
  );
};

export default ChangeLang;
