import { useTranslation } from "react-i18next"

import Container from "../ui/Container/Container"

import styles from "../styles/GeneralDataProtection.module.scss"

const PrivacyPolicyPage = () => {

  const { t } = useTranslation()

  return (
    <Container>
      <div className={styles.main}>
        <h1 className={styles.title} style={{ marginBottom: "30px" }}>{t("privacyPolicyPageTitle")}</h1>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("privacyPolicyIntro.title")}</h4>
          <p className={styles.textDesc}>{t("privacyPolicyIntro.desc")}</p>

          <p className={styles.textDesc} style={{ fontWeight: "600", margin: "15px 0" }} >{t("privacyPolicyIntro.list1.title")}</p>
          <p className={styles.textDesc}>{t("privacyPolicyIntro.list1.desc")}</p>

          <p className={styles.textDesc} style={{ fontWeight: "600", margin: "15px 0" }}>{t("privacyPolicyIntro.list2.title")}</p>
          <ul className={styles.textList}>
            <li>{t("privacyPolicyIntro.list2.text1")}</li>
            <li>{t("privacyPolicyIntro.list2.text2")}</li>
            <li>{t("privacyPolicyIntro.list2.text3")}
              <a className={styles.emailText} href="mailto:privacy.reli.one@gmail.com" target="_blank" >{t("privacyPolicyIntro.list2.email")}</a></li>
          </ul>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("privacyPolicyScope.title")}</h4>
          <p className={styles.textDesc}>{t("privacyPolicyScope.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("privacyPolicyPersonalData.title")}</h4>
          <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("privacyPolicyPersonalData.desc")}</p>
          <ul className={styles.textList}>
            <li>{t("privacyPolicyPersonalData.list.text1")}</li>
            <li>{t("privacyPolicyPersonalData.list.text2")}</li>
            <li>{t("privacyPolicyPersonalData.list.text3")}</li>
            <li>{t("privacyPolicyPersonalData.list.text4")}</li>
            <li>{t("privacyPolicyPersonalData.list.text5")}</li>
            <li>{t("privacyPolicyPersonalData.list.text6")}</li>
          </ul>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("purposesProcessing.title")}</h4>
          <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("purposesProcessing.desc")}</p>
          <ul className={styles.textList}>
            <li>{t("purposesProcessing.list.text1")}</li>
            <li>{t("purposesProcessing.list.text2")}</li>
            <li>{t("purposesProcessing.list.text3")}</li>
            <li>{t("purposesProcessing.list.text4")}</li>
            <li>{t("purposesProcessing.list.text5")}</li>
            <li>{t("purposesProcessing.list.text6")}</li>
            <li>{t("purposesProcessing.list.text7")}</li>
          </ul>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("lawfulBases.title")}</h4>
          <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("lawfulBases.desc")}</p>
          <ul className={styles.textList}>
            <li>{t("lawfulBases.list.text1")}</li>
            <li>{t("lawfulBases.list.text2")}</li>
            <li>{t("lawfulBases.list.text3")}</li>
            <li>{t("lawfulBases.list.text4")}</li>
          </ul>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("dataRetention.title")}</h4>
          <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("dataRetention.desc")}</p>
          <ul className={styles.textList}>
            <li>{t("dataRetention.list.text1")}</li>
            <li>{t("dataRetention.list.text2")}</li>
            <li>{t("dataRetention.list.text3")}</li>
          </ul>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("disclosures.title")}</h4>
          <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("disclosures.desc")}</p>
          <ul className={styles.textList}>
            <li>{t("disclosures.list.text1")}</li>
            <li>{t("disclosures.list.text2")}</li>
            <li>{t("disclosures.list.text3")}</li>
            <li>{t("disclosures.list.text4")}</li>
          </ul>
          <p className={styles.textDesc} style={{ marginTop: "15px" }}>{t("disclosures.afterDesc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("internationalTransfers.title")}</h4>
          <p className={styles.textDesc}>{t("internationalTransfers.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("securityMeasures.title")}</h4>
          <p className={styles.textDesc}>{t("securityMeasures.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("dataSubjectRights.title")}</h4>
          <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("dataSubjectRights.desc")}</p>
          <ul className={styles.textList}>
            <li>{t("dataSubjectRights.list.text1")}</li>
            <li>{t("dataSubjectRights.list.text2")}</li>
            <li>{t("dataSubjectRights.list.text3")}</li>
            <li>{t("dataSubjectRights.list.text4")}</li>
            <li>{t("dataSubjectRights.list.text5")}</li>
            <li>{t("dataSubjectRights.list.text6")}</li>
            <li>{t("dataSubjectRights.list.text7")}</li>
          </ul>
          <p className={styles.textDesc} style={{ marginTop: "15px" }}>
            {t("dataSubjectRights.emailText.first")}
            <a href="mailto:privacy.reli.one@gmail.com" className={styles.emailText}>{t("dataSubjectRights.emailText.email")}</a>
            {t("dataSubjectRights.emailText.second")}
          </p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("privacyPolicyCookies.title")}</h4>
          <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("privacyPolicyCookies.desc")}</p>
          <ul className={styles.textList}>
            <li>{t("privacyPolicyCookies.list.text1")}</li>
            <li>{t("privacyPolicyCookies.list.text2")}</li>
            <li>{t("privacyPolicyCookies.list.text3")}</li>
            <li>{t("privacyPolicyCookies.list.text4")}</li>
          </ul>
          <p className={styles.textDesc} style={{ marginTop: "15px" }}>{t("privacyPolicyCookies.afterDesc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("dataBreachNotification.title")}</h4>
          <p className={styles.textDesc}>{t("dataBreachNotification.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("dataProcessingAgreements.title")}</h4>
          <p className={styles.textDesc}>{t("dataProcessingAgreements.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("trainingAwareness.title")}</h4>
          <p className={styles.textDesc}>{t("trainingAwareness.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("auditsCompliance.title")}</h4>
          <p className={styles.textDesc}>{t("auditsCompliance.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("policyPrivacyReview.title")}</h4>
          <p className={styles.textDesc}>{t("policyPrivacyReview.desc")}</p>
        </div>
        <div className={styles.textBlock}>
          <h4 className={styles.textTitle}>{t("furtherInformation.title")}</h4>
          <p className={styles.textDesc}>
            {t("furtherInformation.text")}
            <a href="https://gdpr.eu/" target="_blank" className={styles.emailText}>{t("furtherInformation.url")}</a>
            {"."}
          </p>
        </div>
      </div>
    </Container>
  )
}

export default PrivacyPolicyPage