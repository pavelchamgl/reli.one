import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"


import styles from "./BusinessAddress.module.scss"

const BusinessAddress = ({ data }) => {



    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={addressIc} alt="" />
                    <h3>Business Address</h3>
                </div>

                <EditBtn />
            </div>
            <p className={styles.addressText}>{`${data?.street}, ${data?.city}, ${data?.address_country?.toUpperCase() || data?.country?.toUpperCase()}`}</p>
        </div>
    )
}

export default BusinessAddress