
import verifiedIc from "../../../assets/sellerAnalyt/verifiedIc.svg"

import styles from "./YourVerifiedBlock.module.scss"


const YourVerifiedBlock = () => {
    return (
        <div className={styles.main}>
            <img src={verifiedIc} alt="" />

            <div>
                <div className={styles.titleWrap}>
                    <h4>You're verified!</h4>
                    <span>Verified Seller</span>
                </div>

                <p className={styles.congratulat}>Congratulations! Your seller account has been approved. Complete the steps below to start selling.</p>
                <p className={styles.approveDate}>Approved on March 19, 2026</p>
            </div>

        </div>
    )
}

export default YourVerifiedBlock