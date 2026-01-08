import TitleAndDesc from "../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc"

import bigMark from "../../../../assets/Seller/register/markBig.svg"
import markSmall from "../../../../assets/Seller/register/markGreenSmall.svg"
import homeIc from "../../../../assets/Seller/register/homeIc.svg"

import styles from "./ApplicationSubmited.module.scss"
import FormLink from "../../../../ui/Seller/auth/formLink/FormLink"

const ApplicationSubmitedContent = () => {
    return (
        <div className={styles.main}>
            <img className={styles.bigImg} src={bigMark} alt="" />
            <TitleAndDesc title={"Your Application Has Been Submitted!"}
                desc={"Thank you for submitting your seller application. Our team will review your information and get back to you soon."} />

            <div className={styles.statusBlock}>
                <div className={styles.applicationStatus}>
                    <div>
                        <img src={markSmall} alt="" />
                    </div>

                    <div>
                        <p>Application Status</p>
                        <span>Pending Verification</span>
                    </div>
                </div>

                <div className={styles.applicationInfo}>
                    <p>Verification usually takes <span>24-48 hours</span></p>
                    <p>You will receive an email notification once your application has been reviewed. Please check your inbox regularly.</p>
                </div>

            </div>

            <div className={styles.whatHappens}>
                <p>What happens next?</p>
                <ul>
                    <li>
                        <span>1</span>
                        Our team will verify your submitted information and documents
                    </li>
                    <li>
                        <span>2</span>
                        You'll receive an email with the verification results
                    </li>
                    <li>
                        <span>3</span>
                        Once approved, you can start selling on our platform immediately
                    </li>
                </ul>
            </div>

            <button className={styles.returnHomeBtn}>
                <img src={homeIc} alt="" />
                Return to Homepage
            </button>



            <div className={styles.bottomLinkWrap}>
                <p>Need help?</p>
                <FormLink text={"Contact support"} />
            </div>

        </div>
    )
}

export default ApplicationSubmitedContent