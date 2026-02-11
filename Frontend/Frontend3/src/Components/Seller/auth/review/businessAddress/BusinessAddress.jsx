import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"


import styles from "./BusinessAddress.module.scss"

const BusinessAddress = ({ data }) => {

    const countryArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    const country = countryArr.find((item) => item.value === data?.country)

    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={addressIc} alt="" />
                    <h3>Business Address</h3>
                </div>

                <EditBtn />
            </div>
            <p className={styles.addressText}>{`${data?.street}, ${data?.city}, ${country.text}`}</p>
        </div>
    )
}

export default BusinessAddress