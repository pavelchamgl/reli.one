import personalIc from "../../../../../assets/Seller/register/personalDetailsRevies.svg"
import { countriesArr } from "../../../../../code/seller";
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./PersonalDetails.module.scss"

const PersonalDetails = ({ data, setOpen }) => {


    const nationality = countriesArr.find((item) => item?.value === data?.nationality)

    const tax_country = countriesArr.find((item) => item?.value === data?.tax_country)





    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={personalIc} alt="" />
                    <h3>Tax information</h3>
                </div>

                <EditBtn setOpen={setOpen} />
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
                        <span className={styles.num}>{data?.ico}</span>
                    </li>
                }
                {
                    data?.vat_id &&
                    <li>
                        <p>Vat id</p>
                        <span className={styles.num}>{data?.vat_id}</span>
                    </li>
                }
               
            </ul>
        </div>
    )
}

export default PersonalDetails