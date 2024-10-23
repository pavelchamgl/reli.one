import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useActions } from "../hook/useAction";

import { deleteAccount, logout } from "../api/auth";
import packetIcon from "../assets/profileNav/packetIcon.svg";
import logOutIcon from "../assets/profileNav/logOut.svg";
import settingsIcon from "../assets/profileNav/settingsIcon.svg";
import arrRight from "../assets/profileNav/arrRight.svg";
import arrDown from "../assets/profileNav/arrDown.svg";

import styles from "../styles/MobProfileNavPage.module.scss";

const MobProfileNavPage = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logOut, setLogout] = useState(false);

  const { t } = useTranslation();

  const navigate = useNavigate();

  const { clearBasket } = useActions();

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    refresh: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Получаем данные из localStorage
    const tokenData = localStorage.getItem("token");

    // Проверяем, есть ли данные в localStorage
    if (tokenData) {
      try {
        // Парсим данные из JSON-формата
        const parsedToken = JSON.parse(tokenData);

        // Проверяем наличие необходимых полей
        const { first_name, last_name, refresh } = parsedToken;

        // Проверяем, что все поля существуют
        if (first_name && last_name && refresh) {
          setUserData({
            firstName: first_name,
            lastName: last_name,
            refresh: refresh,
          });
        } else {
          setError("Отсутствуют необходимые поля в токене.");
        }
      } catch (error) {
        setError("Ошибка парсинга данных из localStorage.");
        console.error("Ошибка парсинга данных из localStorage:", error);
      }
    } else {
      setError("Токен не найден в localStorage.");
    }
  }, []);

  const handleLogout = () => {
    logout({ refresh_token: userData?.refresh }).then((res) => {
      localStorage.removeItem("token");
      localStorage.removeItem("basket");
      localStorage.removeItem("selectedProducts");
      localStorage.removeItem("basketTotal");
      localStorage.removeItem("email");
      clearBasket();
      navigate("/");
      window.location.reload();
    });
  };

  const handleDeleteAgree = () => {
    deleteAccount().then((res) => {
      localStorage.removeItem("token");
      localStorage.removeItem("basket");
      localStorage.removeItem("selectedProducts");
      localStorage.removeItem("basketTotal");
      window.location.reload();
    });
  };

  return (
    <div className={styles.main}>
      <div>
        <h3 className={styles.title}>{t("account")}</h3>
        <p
          className={styles.name}
        >{`${userData?.firstName} ${userData?.lastName}`}</p>
        {logOut ? (
          <div className={styles.logOutWrap}>
            <div>
              <p className={styles.logOutText}>{t("delete_account_desc")}</p>
              <div className={styles.logBtnDiv}>
                <button onClick={handleDeleteAgree}>{t("yes")}</button>
                <button onClick={() => setLogout(false)}>{t("no")}</button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.btnDiv}>
            <button
              onClick={() => navigate("/my_orders")}
              className={styles.navBtn}
            >
              <img src={packetIcon} alt="" />
              <span>{t("my_orders")}</span>
            </button>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={styles.navSettingsBtn}
            >
              <div>
                <img src={settingsIcon} alt="" />
                <span>{t("settings")}</span>
              </div>
              <img src={settingsOpen ? arrDown : arrRight} alt="" />
            </button>
            {settingsOpen && (
              <div className={styles.settingsDiv}>
                <button onClick={() => navigate("/email_pass_conf")}>
                  {t("change_pass")}
                </button>
                <button onClick={() => setLogout(true)}>
                  {t("delete_account")}
                </button>
              </div>
            )}
            <button onClick={handleLogout} className={styles.navBtn}>
              <img src={logOutIcon} alt="" />
              <span>{t("log_out")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobProfileNavPage;
