import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import Container from "../ui/Container/Container"
import timeIc from "../assets/claim/time.svg"
import file from "../../public/Odstoupení od smlouvy a vrácení zboží reli.one (1).pdf"

import styles from "../styles/ClaimsAndRightsPage.module.scss"

const Withdrawal = () => {

    const navigate = useNavigate()
    const { t } = useTranslation('claim')

    return (
        <div>
            <div className={styles.titleWrap}>
                <h1>{t('withdawal.title')}</h1>
            </div>
            <Container>
                <div className={styles.mainWrap}>
                    <div className={styles.block}>
                        <p>{t('withdawal.text1')}</p>
                        <p>{t('withdawal.text2')}</p>
                        <p>{t('withdawal.text3')}</p>
                        <p>{t('withdawal.text4')}</p>
                    </div>
                    <div className={styles.dayReturnBlock}>
                        <div className={styles.iconWrap}>
                            <img src={timeIc} alt="" />
                        </div>
                        <div>
                            <h3><span>14</span>{t('withdawal.blockTitle')}</h3>
                            <p>
                                {t('withdawal.blockDesc')}
                                <span>14</span>
                                {t('withdawal.afterDesc')}
                            </p>
                        </div>
                    </div>
                    <div className={styles.btnWrap}>
                        <button
                            onClick={() => navigate('/new-term')}
                            className={styles.yellBtn}>
                            {t('withdawal.moreInfo')}
                        </button>
                        <a href={file} download>
                            <button className={styles.bordBtn}>
                                {t('withdawal.withForm')}
                            </button>
                        </a>
                    </div>

                </div>


            </Container>
        </div>
    )
}

export default Withdrawal

// "withdawal": {
//     "title": "",
//     "text1": "",
//     "text2": "",
//     "text3": "",
//     "text4": "",
//     "moreInfo": "",
//     "claimForm": "",
//     "afterDesc": ""
// }