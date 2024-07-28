import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./MobResenzeBtn.module.scss";

const MobResenzeBtn = () => {
  const [showButton, setShowButton] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const { id } = useParams();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Проверка направления прокрутки
      if (scrollTop > lastScrollTop) {
        // Прокрутка вниз
        setShowButton(true);
      } else {
        // Прокрутка вверх
        setShowButton(false);
      }

      setLastScrollTop(scrollTop <= 0 ? 0 : scrollTop); // Обновление позиции прокрутки
    };

    // Добавление обработчика события scroll
    window.addEventListener("scroll", handleScroll);

    // Очистка обработчика при размонтировании компонента
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollTop]);
  return (
    <>
      {showButton && (
        <div className={styles.navMain}>
          <button onClick={() => navigate(`/mob_resenze_create/${id}`)}>
            {t("write_review")}
          </button>
        </div>
      )}
    </>
  );
};

export default MobResenzeBtn;
