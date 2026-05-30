
import docMarkIc from "../../../assets/sellerAnalyt/docMark.svg"
import greenCircleMark from "../../../assets/sellerAnalyt/greenCircleMark.svg"

import styles from "./SellerAgreement.module.scss"


const AgreementSigment = () => {
    return (
        <div className={styles.agreementWrap}>

            <img src={greenCircleMark} alt="" />

            <div>
                <h6>Agreement signed</h6>
                <p className={styles.agreementDate}>Signed on March <span>19, 2026</span></p>
            </div>

        </div>
    )
}


const SellerAgreement = () => {




    return (
        <div className={styles.main}>
            <img src={docMarkIc} alt="" />

            <div>
                <h5>Seller Agreement</h5>


                {/* <>
                    <p className={styles.text}>Before you can start selling, please review and sign the seller agreement. This agreement outlines the terms of service, commission structure, and your responsibilities as a verified seller.</p>
                    <button className={styles.btn}>Review and sign agreement</button>
                </> */}

                <AgreementSigment />
            </div>
        </div>
    )
}

export default SellerAgreement