import { useState } from "react";

import closeIcon from "../assets/loginModal/loginModalX.svg";
import packetIcon from "../assets/profileNav/packetIcon.svg";
import logOutIcon from "../assets/profileNav/logOut.svg";
import settingsIcon from "../assets/profileNav/settingsIcon.svg";
import arrRight from "../assets/profileNav/arrRight.svg";
import arrDown from "../assets/profileNav/arrDown.svg";

import styles from "../styles/MobProfileNavPage.module.scss";

const MobProfileNavPage = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logOut, setLogout] = useState(false);

  return (
    <div className={styles.main}>
      <div>
        <h3 className={styles.title}>účet</h3>
        <p className={styles.name}>Nikita Malgin</p>
        {logOut ? (
          <div className={styles.logOutWrap}>
            <div>
              <p className={styles.logOutText}>
                Opravdu chcete smazat svůj účet?
              </p>
              <div className={styles.logBtnDiv}>
                <button>Ano</button>
                <button onClick={() => setLogout(false)}>Ne</button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.btnDiv}>
            <button className={styles.navBtn}>
              <img src={packetIcon} alt="" />
              <span>Moje objednávky</span>
            </button>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={styles.navSettingsBtn}
            >
              <div>
                <img src={settingsIcon} alt="" />
                <span>Nastavení</span>
              </div>
              <img src={settingsOpen ? arrDown : arrRight} alt="" />
            </button>
            {settingsOpen && (
              <div className={styles.settingsDiv}>
                <button>Změna hesla</button>
                <button onClick={() => setLogout(true)}>Smazat účet</button>
              </div>
            )}
            <button className={styles.navBtn}>
              <img src={logOutIcon} alt="" />
              <span>Vystupte</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobProfileNavPage;
