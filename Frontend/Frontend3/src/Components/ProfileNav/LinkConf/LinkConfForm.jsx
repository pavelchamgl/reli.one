import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";

import AuthInp from "../../../ui/AuthInp/AuthInp";

import styles from "./LinkConfForm.module.scss";

const LinkConfForm = () => {
  const [size, setSize] = useState("450px");
  const [time, setTime] = useState(59);

  const isMobile = useMediaQuery({ maxWidth: 460 });

  useEffect(() => {
    if (isMobile) {
      setSize("286px");
    } else {
      setSize("450px");
    }
  }, [isMobile]);

  let timeInterval;

  useEffect(() => {
    timeInterval = setInterval(() => {
      if (time > 0) {
        setTime((prev) => prev - 1);
      }
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [time]);

  return (
    <div>
      <div className={styles.main}>
        <h3 className={styles.title}>Potvrzení registrace</h3>
        <p className={styles.desc}>
          Do vaší e-mailové schránky byl odeslán potvrzovací e-mail. Postupujte
          podle odkazu v e-mailu a potvrďte svou e-mailovou adresu
        </p>
        <p className={styles.timerText}>
          možnost opětovného odeslání {time ? `po 0:${time}` : ""}
        </p>
        <button
          disabled={time}
          onClick={() => setTime(59)}
          style={{ width: size }}
          className={styles.subBtn}
        >
          {isMobile
            ? "Opětovné odeslání"
            : "Opětovné zaslání potvrzovacího e-mailu"}
        </button>
      </div>
    </div>
  );
};

export default LinkConfForm;
