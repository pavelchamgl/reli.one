
import { useSelector } from "react-redux"

import accountInfo from "../../../../../assets/Seller/register/accountInfoIc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./AccountInfo.module.scss"
import { countriesArr } from "../../../../../code/seller"
import PrevDocBtn from "../../../newOrder/prevDocBtn/PrevDocBtn"

const AccountInfo = ({ data, type, isCompany, setOpen }) => {

    const { registerData, selfData, companyData } = useSelector(state => state.selfEmploed)


    console.log(data);


    const storeData = isCompany ? companyData : selfData


    const nationality = countriesArr.find((item) => item.value === data?.nationality)


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={accountInfo} alt="" />
                    <h3>{isCompany ? "Representative" : "Account Information"}</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>Name</p>
                    <span>{`${data?.first_name} ${data?.last_name}`}</span>
                </li>
                <li>
                    <p>Date of birth</p>
                    <span className={styles.num}>{`${data?.date_of_birth}`}</span>
                </li>
                <li>
                    <p>Email</p>
                    <span>{registerData?.email ? registerData?.email : "1@gmail.com"}</span>
                </li>
                {
                    isCompany &&
                    <li>
                        <p>Role</p>
                        <span>{data?.role}</span>
                    </li>

                }
                <li>
                    <p>Phone</p>
                    <span className={styles.num}>{data?.personal_phone || data?.company_phone}</span>
                </li>
                {/* <li>
                    <p>Nationality</p>
                    <span>{nationality?.text}</span>
                </li> */}
                <li>
                    <p>Seller Type</p>
                    <span>{type === "company" ? "Company / Legal entity" : "Self-employed / Sole proprietor"}</span>
                </li>
            </ul>
            {
                storeData?.front && storeData?.back &&

                <div >
                    <p className={styles.docTitle}>Identity document</p>
                    <div className={styles.twoDocWrap}>
                        <PrevDocBtn setOpen={setOpen} text={storeData?.front} />
                        <PrevDocBtn setOpen={setOpen} text={storeData?.back} />
                    </div>
                </div>
            }

        </div>
    )
}

export default AccountInfo