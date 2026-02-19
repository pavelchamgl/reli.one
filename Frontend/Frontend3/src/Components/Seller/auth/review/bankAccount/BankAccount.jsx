import bankIc from "../../../../../assets/Seller/register/bankAcc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"


import styles from "./BankAccount.module.scss"

const BankAccount = ({ data, setOpen }) => {
    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={bankIc} alt="" />
                    <h3>Bank Account</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>
            <ul className={styles.infoList}>
                <li>
                    <p>SWIFT/BIC</p>
                    <span className={styles.num}>{data?.swift_bic}</span>
                </li>
                <li>
                    <p>Account Holder</p>
                    <span className={styles.num}>{data?.account_holder}</span>
                </li>
                <li>
                    <p>IBAN</p>
                    <span className={styles.num}>{data?.iban}</span>
                </li>
                {
                    data?.bank_code &&
                    <li>
                        <p>Bank code</p>
                        <span className={styles.num}>{data?.bank_code}</span>
                    </li>
                }
                {
                    data?.local_account_number &&
                    <li>
                        <p>Local account number</p>
                        <span className={styles.num}>{data?.local_account_number}</span>
                    </li>
                }
            </ul>
        </div>
    )
}

export default BankAccount