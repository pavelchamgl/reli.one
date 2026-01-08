import accountInfo from "../../../../../assets/Seller/register/accountInfoIc.svg"
import editIc from "../../../../../assets/Seller/register/editIc.svg"

import styles from "./AccountInfo.module.scss"

const AccountInfo = () => {
    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={accountInfo} alt="" />
                    <h3>Account Information</h3>
                </div>

                <button>
                    <img src={editIc} alt="" />
                    Edit
                </button>
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>Name</p>
                    <span>John Doe</span>
                </li>
                <li>
                    <p>Email</p>
                    <span>1@mail.ru</span>
                </li>
                <li>
                    <p>Phone</p>
                    <span>1234</span>
                </li>
                <li>
                    <p>Seller Type</p>
                    <span>Self-employed / Sole proprietor</span>
                </li>
            </ul>

        </div>
    )
}

export default AccountInfo