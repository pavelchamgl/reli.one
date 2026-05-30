
import whatNextIc from "../../../assets/sellerAnalyt/whatNext.svg"
import messageIc from "../../../assets/sellerAnalyt/messageIc.svg"

import styles from "./WhatNextBlock.module.scss"

const WhatNextBlock = () => {
  return (
    <div className={styles.main}>
        <img className={styles.mainImg} src={whatNextIc} alt="" />

        <div>
            <h5>What happens next?</h5>
            <p>Verification usually takes 24–48 hours. Our team will carefully review your information and documents. You'll receive an email notification once the review is complete.</p>

            <button className={styles.contactBtn}>
                <img src={messageIc} alt="" />
                Contact Support
            </button>
        </div>
    </div>
  )
}

export default WhatNextBlock