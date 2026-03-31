import ActionRequiredBlock from "../../Components/sellerAnalytics/ActionRequiredBlock/ActionRequiredBlock"
import RequiredDocuments from "../../Components/sellerAnalytics/RequiredDocuments/RequiredDocuments"
import VerificationSteps from "../../Components/sellerAnalytics/VerificationSteps/VerificationSteps"
import styles from "./ActionRequiredPage.module.scss"

const ActionRequiredPage = () => {
    return (
        <div className={styles.pageWrap}>
            <ActionRequiredBlock />
            <VerificationSteps />
            <RequiredDocuments />

        </div>
    )
}

export default ActionRequiredPage