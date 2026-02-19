import { useLocation } from "react-router-dom";
import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import { countriesArr } from "../../../../../code/seller";
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"


import styles from "./BusinessAddress.module.scss"

const BusinessAddress = ({ data, setOpen }) => {

    const { pathname } = useLocation()

    const country = countriesArr.find((item) => item.value === data?.country)

    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={addressIc} alt="" />
                    <h3>{pathname === "/seller/seller-review" ? "Address" : "Business Address"}</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>
            <p className={styles.addressText}>{`${data?.street}, ${data?.city}, ${country?.text} , ${data?.zip_code}`}</p>
        </div>
    )
}

export default BusinessAddress