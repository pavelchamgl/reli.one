
import blueCautionIc from "../../../assets/sellerAnalyt/blueCaution.svg"

import styles from "./UnderReviewBlock.module.scss"


const StatusComp = () => {
    return (
        <div className={styles.status}>
            <div className={`${styles.item} ${styles.completed}`}>
                <div className={styles.circle}>
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M20 6L9 17L4 12"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <div className={styles.content}>
                    <h4>Submitted</h4>
                    <p>Mar 18, 2026</p>
                </div>
            </div>


            <div className={`${styles.item} ${styles.review}`}>
                <div className={styles.circle}>
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="white"
                            strokeWidth="2"
                        />

                        <path
                            d="M12 7V12L15 14"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <div className={styles.content}>
                    <h4>In Review</h4>
                    <p>Est. 24-48 hours</p>
                </div>
            </div>


            <div className={`${styles.item} ${styles.pending}`}>
                <div className={styles.circle} />

                <div className={styles.content}>
                    <h4>Approved</h4>
                </div>
            </div>
        </div>
    )
}


const UnderReviewBlock = () => {
    return (
        <div className={styles.main}>
            <div className={styles.mailnTitleWrap}>
                <img src={blueCautionIc} alt="" />
                <div>
                    <h3>Under review</h3>
                    <p>Your verification is being reviewed by our team. We'll notify you once it's complete.</p>
                </div>
            </div>

            <div className={styles.timelineWrap}>
                <h5>Verification Timeline</h5>

                <StatusComp />
            </div>
        </div>
    )
}

export default UnderReviewBlock