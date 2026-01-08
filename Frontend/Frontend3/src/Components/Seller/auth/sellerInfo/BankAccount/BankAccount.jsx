
import bankAcc from "../../../../../assets/Seller/register/bankAcc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"


import styles from "./BankAccount.module.scss"

const BankAccount = () => {
    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={bankAcc} alt="" />
                <h2>Bank Account</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"IBAN"} type={"text"} circle={true} required={true} afterText={"Up to 34 characters, letters and digits only"} />
                <InputSeller title={"SWIFT/BIC"} type={"text"} circle={true} required={true} afterText={"8–11 characters"} />
                <InputSeller title={"Account holder"} type={"text"} circle={true} required={true} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"Bank code"} type={"text"} circle={true} required={true} />
                    <InputSeller title={"Local account number"} type={"text"} circle={true} required={true} />
                </div>



            </div>


        </div>
    )
}

export default BankAccount