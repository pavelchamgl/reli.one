

import accountInfo from "../../../../../assets/Seller/register/accountInfoIc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./AccountInfo.module.scss"

const AccountInfo = ({ data, type }) => {




    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={accountInfo} alt="" />
                    <h3>Account Information</h3>
                </div>

                <EditBtn />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>Name</p>
                    <span>{`${data?.first_name} ${data?.last_name}`}</span>
                </li>
                <li>
                    <p>Email</p>
                    <span>1@mail.ru</span>
                </li>
                <li>
                    <p>Phone</p>
                    <span>{data?.personal_phone||data?.company_phone}</span>
                </li>
                <li>
                    <p>Seller Type</p>
                    <span>{type === "company"?"Company / Legal entity":"Self-employed / Sole proprietor"}</span>
                </li>
            </ul>

        </div>
    )
}

export default AccountInfo