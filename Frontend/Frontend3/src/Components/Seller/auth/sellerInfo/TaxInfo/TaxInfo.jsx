import InputSeller from '../../../../../ui/Seller/auth/inputSeller/InputSeller'
import SellerDateInp from '../dateInp/DateInp'
import SellerInfoSellect from '../sellerinfoSellect/SellerInfoSellect'

import taxInfo from "../../../../../assets/Seller/register/taxInfo.svg"

import styles from './TaxInfo.module.scss'

const TaxInfo = () => {
    return (
        <div className={styles.main}>

            <div className={styles.titleWrap}>
                <img src={taxInfo} alt="" />
                <h2>Tax Information</h2>
            </div>

            <div className={styles.inpWrapMain}>
                <SellerInfoSellect />
                <InputSeller title={"TIN (Tax Identification Number)"} type={"text"} circle={true} required={true} />
                <InputSeller title={"IČO"} type={"text"} circle={true} required={true} />
                <InputSeller title={"VAT ID"} type={"text"} circle={true}  />
             

            </div>


        </div>
    )
}

export default TaxInfo