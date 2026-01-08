
import warehouseIc from "../../../../../assets/Seller/register/warehouseIc.svg"
import InputSeller from "../../../../../ui/Seller/auth/inputSeller/InputSeller"
import SellerInfoSellect from "../sellerinfoSellect/SellerInfoSellect"

import styles from "./WareHouseAddress.module.scss"

const WhareHouseAddress = () => {
    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={warehouseIc} alt="" />
                <h2>Warehouse Address</h2>
            </div>

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

export default WhareHouseAddress