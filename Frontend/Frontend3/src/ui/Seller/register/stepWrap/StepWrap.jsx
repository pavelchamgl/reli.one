import { useTranslation } from 'react-i18next';
import styles from './StepWrap.module.scss';

const StepWrap = ({ step }) => {

    const { t } = useTranslation('onbording')

    return (
        <p className={styles.main}>
            {t('reg.step_label')} <span className={styles.num}>{step}</span> {t('reg.of')} <span className={styles.num}>6</span>
        </p>
    )
}

export default StepWrap