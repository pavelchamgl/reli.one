
import { useSelector } from "react-redux"
import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from './CompanyInfo.module.scss'
import { countriesArr } from "../../../../../code/seller"
import PrevDocBtn from "../../../newOrder/prevDocBtn/PrevDocBtn"

const CompanyInfo = ({ data, setOpen }) => {


    const { registerData, companyData } = useSelector(state => state.selfEmploed)



    const countryOfRegistration = countriesArr.find((item) => item.value === data?.country_of_registration)


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={companyIc} alt="" />
                    <h3>Company Information</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>Company Name</p>
                    <span>{data?.company_name}</span>
                </li>
                <li>
                    <p>Legal form</p>
                    <span >{data?.legal_form}</span>
                </li>
                <li>
                    <p>Country of registration</p>
                    <span >{countryOfRegistration?.text}</span>
                </li>
                {
                    data?.ico &&
                    <li>
                        <p>ICO</p>
                        <span className={styles.num}>{data?.ico}</span>
                    </li>
                }
                {
                    data?.tin &&
                    <li>
                        <p>TIN</p>
                        <span className={styles.num}>{data?.tin}</span>
                    </li>
                }
                {
                    data?.eori_number &&
                    <li>
                        <p>EORI number</p>
                        <span className={styles.num}>{data?.eori_number}</span>
                    </li>
                }
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
                    <span className={styles.num}>{data?.vat_id ? data?.vat_id : "N/A"}</span>
                </li>
                <li>
                    <p>Company phone</p>
                    <span className={styles.num}>{data?.company_phone ? data?.company_phone : "N/A"}</span>
                </li>
            </ul>

            {
                companyData && companyData?.company_file_date &&

                <div>
                    <p className={styles.docTitle}>Registration certificate</p>
                    <PrevDocBtn setOpen={setOpen} text={companyData?.company_file_date} />
                </div>
            }


        </div>
    )
}

export default CompanyInfo