import requiredIc from "../../../assets/sellerAnalyt/requiredBlockIc.svg"
import treanglIc from "../../../assets/sellerAnalyt/treanglIc.svg"

import styles from "./ActionRequiredBlock.module.scss"


const FeedbackBlock = () => {
    return (
        <div className={styles.feedbackBlock}>
            <img src={treanglIc} alt="" />
            <div>
                <p>Personal Information</p>
                <span>Date of birth does not match the ID document</span>
            </div>
        </div>
    )
}

const ActionRequiredBlock = () => {
    return (
        <div className={styles.actionRequiredBlock}>
            <div className={styles.requiredTitleBlock}>
                <img src={requiredIc} alt="" />
                <div>
                    <h2>Action required</h2>
                    <p>Your verification has been rejected. Please review and fix the issues below.</p>
                </div>
            </div>

            <div className={styles.feedbackMainBlock}>
                <h4>Moderator Feedback</h4>
                <FeedbackBlock />
                <FeedbackBlock />
            </div>

            <button className={styles.fixBtn}>
                Fix and resubmit
            </button>

        </div>
    )
}

export default ActionRequiredBlock