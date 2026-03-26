import FinishVerificationBlock from '../../Components/sellerAnalytics/FinishVerificationBlock/FinishVerificationBlock'
import RequiredDocuments from '../../Components/sellerAnalytics/RequiredDocuments/RequiredDocuments'
import VerificationSteps from '../../Components/sellerAnalytics/VerificationSteps/VerificationSteps'

import styles from "./FinishVerificationPage.module.scss"

const FinishVerificationPage = () => {
    return (
        <div className={styles.pageWrap}>
            <FinishVerificationBlock />
            <VerificationSteps />
            <RequiredDocuments />
        </div>
    )
}

export default FinishVerificationPage