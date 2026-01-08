
import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"
import UploadInp from "../uploadInp/UploadInp"

import styles from "./Address.module.scss"

const AddressBlock = () => {
    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={addressIc} alt="" />
                <h2>Address</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <InputSeller title={"Street"} type={"text"} circle={true} required={true} />

                <div className={styles.twoInpWrap}>
                    <InputSeller title={"City"} type={"text"} circle={true} required={true} />
                    <InputSeller title={"ZIP"} type={"text"} circle={true} required={true} />
                    <SellerInfoSellect />
                </div>

                <UploadInp />



            </div>


        </div>
    )
}

export default AddressBlock