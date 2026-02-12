import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";

import telegaWhIcon from "../../assets/Main/whiteTelegaIc.svg";
import whiteX from "../../assets/Seller/newOrder/whiteX.svg";
import styles from "./TelegramMenedgerBtn.module.scss";

const TelegramMeneger = () => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery({ maxWidth: 500 });

  const [isVisible, setIsVisible] = useState(false);        // авто-показ (active)
  const [isAutoDisabled, setIsAutoDisabled] = useState(false); // отключили автоповтор
  const [suppressHover, setSuppressHover] = useState(false);   // отключить hover до mouseleave

  const hideTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isAutoDisabled) return;

    const show = () => {
      setIsVisible(true);

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(
        () => setIsVisible(false),
        isMobile ? 2000 : 10000
      );
    };

    show();
    intervalRef.current = setInterval(show, 20000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isAutoDisabled, isMobile]);

  return (
    <div
      className={`
        ${styles.telegramWrap}
        ${isVisible ? styles.active : ""}
        ${suppressHover ? styles.noHover : ""}
      `}
      onMouseLeave={() => setSuppressHover(false)} // как только ушли — hover снова разрешён
    >
      <div className={styles.label}
        onClick={() => {
          if (isMobile) {
            setIsAutoDisabled(true);  // больше не автопоказываем
            setIsVisible(false);      // закрыли прямо сейчас
            setSuppressHover(true);
          }
        }}
      >
        <p>{t("tgMessage.text")}</p>
        <p>{t("tgMessage.text1")}</p>

        <button
          className={styles.closeX}
          onClick={() => {
            setIsAutoDisabled(true);  // больше не автопоказываем
            setIsVisible(false);      // закрыли прямо сейчас
            setSuppressHover(true);   // и убрали hover до ухода мышки
          }}
        >
          <img src={whiteX} alt="" />
        </button>
      </div>

      <a
        href="https://t.me/+420797837856"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.telegramBtn}
      >
        <img src={telegaWhIcon} alt="" />
      </a>
    </div>
  );
};

export default TelegramMeneger;
