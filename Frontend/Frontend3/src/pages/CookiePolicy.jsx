import { useTranslation } from "react-i18next"

import Container from "../ui/Container/Container"

import styles from "../styles/GeneralDataProtection.module.scss"

const CookiePolicy = () => {

    const { t } = useTranslation()

    return (
        <Container>
            <div className={styles.main}>
                <h1 className={styles.title} style={{ marginBottom: "30px" }}>{t("cookieModalTitle")}</h1>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("generalProvisionsCookie.title")}</h4>
                    <p className={styles.textDesc}>{t("generalProvisionsCookie.text1")}</p>
                    <p className={styles.textDesc}>{t("generalProvisionsCookie.text2")}</p>
                    <p className={styles.textDesc}>{t("generalProvisionsCookie.text3")}</p>
                    <p className={styles.textDesc}>{t("generalProvisionsCookie.text4")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("whatAreCookies.title")}</h4>
                    <p className={styles.textDesc}>{t("whatAreCookies.desc")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("howUseCookie.title")}</h4>
                    <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("howUseCookie.desc1")}</p>

                    <ul className={styles.textList}>
                        <li><strong>{t("howUseCookie.listBold.list1.title")}</strong>{t("howUseCookie.listBold.list1.desc")}</li>
                        <li><strong>{t("howUseCookie.listBold.list2.title")}</strong>{t("howUseCookie.listBold.list2.desc")}</li>
                        <li><strong>{t("howUseCookie.listBold.list3.title")}</strong>{t("howUseCookie.listBold.list3.desc")}</li>
                        <li><strong>{t("howUseCookie.listBold.list4.title")}</strong>{t("howUseCookie.listBold.list4.desc")}</li>
                    </ul>

                    <p className={styles.textDesc} style={{ margin: "15px 0" }}>{t("howUseCookie.desc2")}</p>
                    <ul className={styles.textList}>
                        <li>{t("howUseCookie.list.text1")}</li>
                        <li>{t("howUseCookie.list.text2")}</li>
                        <li>{t("howUseCookie.list.text3")}</li>
                        <li>{t("howUseCookie.list.text4")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("thirdPartyCookies.title")}</h4>
                    <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("thirdPartyCookies.desc")}</p>
                    <ul className={styles.textList}>
                        <li>{t("thirdPartyCookies.list.text1")}</li>
                        <li>{t("thirdPartyCookies.list.text2")}</li>
                        <li>{t("thirdPartyCookies.list.text3")}</li>
                    </ul>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("whatAreYouChoice.title")}</h4>
                    <p className={styles.textDesc}>{t("whatAreYouChoice.desc")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("changesCookiesPolicy.title")}</h4>
                    <p className={styles.textDesc}>{t("changesCookiesPolicy.desc")}</p>
                </div>
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("findMoreInfoCookie.title")}</h4>
                    <p className={styles.textDesc} style={{ marginBottom: "15px" }}>{t("findMoreInfoCookie.desc")}</p>
                    <ul className={styles.textList}>
                        <li>{t("findMoreInfoCookie.list.text")}<a className={styles.emailText} href="https://allaboutcookies.org/" target="_blank">{t("findMoreInfoCookie.list.link")}</a></li>
                    </ul>
                </div>
               
                <div className={styles.textBlock}>
                    <h4 className={styles.textTitle}>{t("contactUs.title")}</h4>
                    <p className={styles.textDesc}>{t("contactUs.text")} <a className={styles.emailText} href="mailto:support600.reli@gmail.com" target='_blank'>{t("contactUs.email")}</a></p>
                 
                </div>
            </div>
        </Container>
    )
}

export default CookiePolicy