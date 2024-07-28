import { useTranslation } from "react-i18next";

import PinInpPassForm from "../Components/OtpPage/PinInpPass/PinInpPassForm";

import styles from "../styles/OtpConfirmPage.module.scss";

const OtpPassConfirmPage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.main}>
      <div>
        <div className={styles.descDiv}>
          <h4>{t("otp_title")}</h4>
          <p>{t("otp_desc")}</p>
        </div>
        <PinInpPassForm />
      </div>
    </div>
  );
};

export default OtpPassConfirmPage;
