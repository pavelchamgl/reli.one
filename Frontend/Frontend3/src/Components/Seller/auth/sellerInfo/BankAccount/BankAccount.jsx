
import bankAcc from "../../../../../assets/Seller/register/bankAcc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"


import styles from "./BankAccount.module.scss"

const BankAccount = ({ formik }) => {
    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={bankAcc} alt="" />
                <h2>Bank Account</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"IBAN"} type={"text"} circle={true} required={true} afterText={"Up to 34 characters, letters and digits only"} placeholder={"CZ65 0800 0000 1920 0014 5399"} num={true} name="iban" value={formik.values.iban} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                <InputSeller title={"SWIFT/BIC"} type={"text"} circle={true} required={true} afterText={"8–11 characters"} placeholder={"GIBACZPX"} name="swift_bic" value={formik.values.swift_bic} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                <InputSeller title={"Account holder"} type={"text"} circle={true} required={true} placeholder={"Must match seller's full name"} name="account_holder" value={formik.values.account_holder} onChange={formik.handleChange} onBlur={formik.handleBlur} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"Bank code"} type={"text"} circle={true} required={true} placeholder={"080"} num={true} name="bank_code" value={formik.values.bank_code} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <InputSeller title={"Local account number"} type={"text"} circle={true} required={true} placeholder={"192001489"} num={true} name="local_account_number" value={formik.values.local_account_number} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                </div>



            </div>


        </div>
    )
}

export default BankAccount