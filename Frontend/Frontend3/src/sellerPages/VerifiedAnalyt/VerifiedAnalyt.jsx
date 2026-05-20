import NextSteps from "../../Components/sellerAnalytics/NextSteps/NextSteps"
import SellerAgreement from "../../Components/sellerAnalytics/SellerAgreement/SellerAgreement"
import VerifiedBenefits from "../../Components/sellerAnalytics/VerifiedBenefits/VerifiedBenefits"
import VerifiedDocuments from "../../Components/sellerAnalytics/VerifiedDocuments/VerifiedDocuments"
import YourVerifiedBlock from "../../Components/sellerAnalytics/YourVerifiedBlock/YourVerifiedBlock"
import styles from "./VerifiedAnalyt.module.scss"

const VerifiedAnalyt = () => {
    return (
        <div className={styles.pageWrap}>
            <YourVerifiedBlock />
            <SellerAgreement />
            <NextSteps />
            <VerifiedBenefits />
            <VerifiedDocuments />

            <p className={styles.updateText}>Last updated: March 18, 2026 at 2:34 PM</p>


        </div>
    )
}

export default VerifiedAnalyt