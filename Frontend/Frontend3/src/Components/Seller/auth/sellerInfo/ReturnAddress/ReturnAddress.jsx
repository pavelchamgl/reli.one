
import returnAddress from "../../../../../assets/Seller/register/returnAddress.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import Checkbox from "../../../../../ui/Seller/newOrder/checkbox/Checkbox"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"

import styles from "./ReturnAddress.module.scss"

const ReturnAddress = () => {
    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={returnAddress} alt="" />
                <h2>Return Address</h2>
            </div>

            <label className={styles.checkWrap}>
                <Checkbox />
                <p>Same as warehouse address</p>
            </label>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true} />
                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true} />
                    <SellerInfoSellect />
                </div>
                <InputSeller title={"Contact phone"} type={"tel"} circle={true} required={true} />



            </div>


        </div>
    )
}

export default ReturnAddress