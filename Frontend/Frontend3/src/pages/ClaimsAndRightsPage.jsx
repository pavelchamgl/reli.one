import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import formular from "../../public/Formulář pro uplatnění reklamace Reli.one (1).pdf"

import Container from "../ui/Container/Container"

import styles from "../styles/ClaimsAndRightsPage.module.scss"

const ClaimsAndRightsPage = () => {

    const navigate = useNavigate()
    const { t } = useTranslation('claim')

    return (
        <div>
            <div className={styles.titleWrap}>
                <h1>{t('claim.title')}</h1>
            </div>
            <Container>
                <div className={styles.mainWrap}>
                    <div className={styles.block}>
                        <p>{t('claim.text1')}</p>
                        <p>{t('claim.text2')}</p>
                        <p>{t('claim.text3')}</p>
                        <p>{t('claim.text4')}</p>
                    </div>
                    <div className={styles.btnWrap}>
                        <button
                            onClick={() => navigate('/new-term')}
                            className={styles.yellBtn}>
                            {t('claim.moreInfo')}
                        </button>
                        <a href={formular} download>
                            <button className={styles.bordBtn}>
                                {t('claim.claimForm')}
                            </button>
                        </a>
                    </div>
                    <p className={styles.afterDesc}>
                        {t('claim.afterDesc')}
                    </p>
                </div>


            </Container>
        </div>
    )
}

export default ClaimsAndRightsPage