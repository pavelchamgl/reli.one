import bankIc from "../../../../../assets/Seller/register/bankAcc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"


import styles from "./BankAccount.module.scss"

const BankAccount = ({ data }) => {
    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={bankIc} alt="" />
                    <h3>Bank Account</h3>
                </div>

                <EditBtn />
            </div>
            <ul className={styles.infoList}>
                <li>
                    <p>Bank Name</p>
                    <span>N/A</span>
                </li>
                <li>
                    <p>Account Holder</p>
                    <span className={styles.num}>{data?.account_holder}</span>
                </li>
                <li>
                    <p>IBAN</p>
                    <span className={styles.num}>{data?.iban}</span>
                </li>
            </ul>
        </div>
    )
}

export default BankAccount