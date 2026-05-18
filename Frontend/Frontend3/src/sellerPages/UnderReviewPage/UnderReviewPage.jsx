import RequiredDocuments from "../../Components/sellerAnalytics/RequiredDocuments/RequiredDocuments"
import UnderInformationWrap from "../../Components/sellerAnalytics/UnderInformationWrap/UnderInformationWrap"
import UnderReviewBlock from "../../Components/sellerAnalytics/UnderReviewBlock/UnderReviewBlock"
import WhatNextBlock from "../../Components/sellerAnalytics/WhatNextBlock/WhatNextBlock"
import styles from "./UnderReviewPage.module.scss"

const UnderReviewPage = () => {
    return (
        <div className={styles.pageWrap}>
            <UnderReviewBlock />
            <UnderInformationWrap />
            <RequiredDocuments />
            <WhatNextBlock />

            <p className={styles.updateText}>Last updated: March 18, 2026 at 2:34 PM</p>

        </div>
    )
}

export default UnderReviewPage