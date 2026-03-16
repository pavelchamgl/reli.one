import { useTranslation } from "react-i18next"

import Container from "../ui/Container/Container"
import emailIc from "../assets/claim/mail.svg"
import phoneIc from "../assets/claim/phone.svg"
import file from "../../public/Odstoupení od smlouvy a vrácení zboží reli.one (1).pdf"
import formular from "../../public/Formulář pro uplatnění reklamace Reli.one (1).pdf"

import styles from "../styles/ClaimsAndRightsPage.module.scss"

const ContactReturnPage = () => {

    const { t } = useTranslation('claim')

    return (
        <div>
            <div className={styles.titleWrap}>
                <h1>{t('contact.title')}</h1>
            </div>
            <Container>
                <div className={styles.mainWrap}>
                    <div className={styles.block}>
                        <p>{t('contact.text1')}</p>
                    </div>

                    <div style={{ padding: "32px" }} className={styles.dayReturnBlock}>
                        <p>{t('contact.afterDesc')}</p>
                    </div>

                    <div className={styles.mainMailPhoneWrap}>
                        <div className={styles.mailPhoneWrap}>
                            <div className={styles.iconWrap}>
                                <img src={emailIc} alt="" />
                            </div>
                            <div>
                                <span>{t('contact.emailText')}</span>
                                <p>support600.reli@gmail.com</p>
                            </div>
                        </div>
                        <div className={styles.mailPhoneWrap}>
                            <div className={styles.iconWrap}>
                                <img src={phoneIc} alt="" />
                            </div>
                            <div>
                                <span>{t('contact.phoneText')}</span>
                                <p>+420 797 837 856</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.btnWrap}>
                        <a href={formular} download>
                            <button className={styles.yellBtn}>
                                {t('contact.claimForm')}
                            </button>
                        </a>

                        <a href={file} download>
                            <button className={styles.bordBtn}>
                                {t('contact.withForm')}
                            </button>
                        </a>
                    </div>
                </div>


            </Container>
        </div>
    )
}

export default ContactReturnPage