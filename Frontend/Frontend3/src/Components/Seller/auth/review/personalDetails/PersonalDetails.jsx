import personalIc from "../../../../../assets/Seller/register/personalDetailsRevies.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./PersonalDetails.module.scss"

const PersonalDetails = ({ data }) => {

    const nationalArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    const nationality = nationalArr.find((item) => item.value === data?.nationality)

    
    

    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={personalIc} alt="" />
                    <h3>Personal Details</h3>
                </div>

                <EditBtn />
            </div>
            <ul className={styles.infoList}>
                <li>
                    <p>Date of Birth</p>
                    <span>{data?.date_of_birth}</span>
                </li>
                <li>
                    <p>Tax ID</p>
                    <span>{data?.tax_country}</span>
                </li>
                <li>
                    <p>Nationality</p>
                    <span>{nationality?.text}</span>
                </li>
            </ul>
        </div>
    )
}

export default PersonalDetails