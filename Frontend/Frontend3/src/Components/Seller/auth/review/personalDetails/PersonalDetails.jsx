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

    const nationality = nationalArr.find((item) => item?.value === data?.nationality)

    const tax_country = nationalArr.find((item) => item?.value === data?.tax_country)





    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={personalIc} alt="" />
                    <h3>Tax information</h3>
                </div>

                <EditBtn />
            </div>
            <ul className={styles.infoList}>
                <li>
                    <p>TIN</p>
                    <span className={styles.num}>{data?.tin}</span>
                </li>
                <li>
                    <p>Tax country</p>
                    <span>{tax_country?.text}</span>
                </li>
                {
                    data?.ico &&
                    <li>
                        <p>ICO</p>
                        <span className={styles.num}>{data?.text}</span>
                    </li>
                }
                {
                    data?.vat_id &&
                    <li>
                        <p>Vat id</p>
                        <span className={styles.num}>{data?.vat_id}</span>
                    </li>
                }
                <li>
                    <p>Nationality</p>
                    <span>{nationality?.text}</span>
                </li>
            </ul>
        </div>
    )
}

export default PersonalDetails