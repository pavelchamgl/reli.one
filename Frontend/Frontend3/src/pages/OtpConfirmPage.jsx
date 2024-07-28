import { useTranslation } from "react-i18next";

import PinInpForm from "../Components/OtpPage/PinInpForm/PinInpForm";

import styles from "../styles/OtpConfirmPage.module.scss";

const OtpConfirmPage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.main}>
      <div>
        <div className={styles.descDiv}>
          <h4>{t("otp_title")}</h4>
          <p>{t("otp_desc")}</p>
        </div>
        <PinInpForm />
      </div>
    </div>
  );
};

export default OtpConfirmPage;
