
import { useSelector } from "react-redux"
import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from './CompanyInfo.module.scss'

const CompanyInfo = ({ data }) => {


    const { registerData } = useSelector(state => state.selfEmploed)


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={companyIc} alt="" />
                    <h3>Company Information</h3>
                </div>

                <EditBtn />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>Company Name</p>
                    <span>{data?.company_name}</span>
                </li>
                <li>
                    <p>Registration Number</p>
                    <span className={styles.num}>{registerData?.phone ? registerData?.phone : "N/A"}</span>
                </li>
                <li>
                    <p>Business ID</p>
                    <span className={styles.num}>{data?.business_id}</span>
                </li>
                <li>
                    <p>VAT ID</p>
                    <span className={styles.num}>{data?.vat_id?data?.vat_id:"N/A"}</span>
                </li>
            </ul>
        </div>
    )
}

export default CompanyInfo