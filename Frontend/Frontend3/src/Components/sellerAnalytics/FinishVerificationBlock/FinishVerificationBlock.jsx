import { useTranslation } from "react-i18next"
import styles from "./FinishVerificationBlock.module.scss"

const FinishVerificationBlock = () => {

    // const {t} = useTranslation('onbordStatus')

    return (
        <div className={styles.finishVerificationBlock}>
            <div>
                <h3 className={styles.title}>Finish your verification</h3>
                {/* <h3 className={styles.title}>{t('hello')}</h3> */}
                
                <p className={styles.desc}>You need to complete onboarding to activate your account</p>
            </div>

            <div className={styles.progressBlock}>
                <div>
                    <p><span>2</span> of <span>6</span> steps completed</p>
                    <p>33%</p>
                </div>
                <span className={styles.progressLine}
                    style={{
                        background: `linear-gradient(
      to right,
      #000 ${33}%,
      transparent 10%
    ), #CDCCD0`,
                    }}
                ></span>
            </div>

            <button className={styles.btn}>
                Continue onboarding
            </button>

        </div>
    )
}

export default FinishVerificationBlock