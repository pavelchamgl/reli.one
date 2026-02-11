
import { useSelector } from "react-redux"

import accountInfo from "../../../../../assets/Seller/register/accountInfoIc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./AccountInfo.module.scss"

const AccountInfo = ({ data, type, isCompany }) => {

    const { registerData } = useSelector(state => state.selfEmploed)

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
                    <img src={accountInfo} alt="" />
                    <h3>{isCompany ? "Representative" : "Account Information"}</h3>
                </div>

                <EditBtn />
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
                    isCompany ?
                        <li>
                            <p>Role</p>
                            <span>{data?.role}</span>
                        </li>
                        :
                        <li>
                            <p>Phone</p>
                            <span className={styles.num}>{data?.personal_phone || data?.company_phone}</span>
                        </li>
                }
                <li>
                    <p>Phone</p>
                    <span className={styles.num}>{data?.personal_phone || data?.company_phone}</span>
                </li>
                <li>
                    <p>Nationality</p>
                    <span>{nationality.text}</span>
                </li>
                <li>
                    <p>Seller Type</p>
                    <span>{type === "company" ? "Company / Legal entity" : "Self-employed / Sole proprietor"}</span>
                </li>
            </ul>

        </div>
    )
}

export default AccountInfo