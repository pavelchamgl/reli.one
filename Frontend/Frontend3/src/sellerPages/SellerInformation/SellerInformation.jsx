import AddressBlock from "../../Components/Seller/auth/sellerInfo/address/AddressBlock"
import BankAccount from "../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount"
import PersonalDetails from "../../Components/Seller/auth/sellerInfo/PersonalDetails/PersonalDetails"
import ReturnAddress from "../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress"
import TaxInfo from "../../Components/Seller/auth/sellerInfo/TaxInfo/TaxInfo"
import WhareHouseAddress from "../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress"
import AuthBtnSeller from "../../ui/Seller/auth/authBtnSeller/AuthBtnSeller"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"

import styles from "./SellerInformation.module.scss"

const SellerInformation = () => {
    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Seller Information"}
                        desc={"Please provide all required information for verification"} />

                    <StepWrap step={4} />

                </div>

                <PersonalDetails />

                <TaxInfo />

                <AddressBlock />

                <BankAccount />

                <WhareHouseAddress />

                <ReturnAddress />

                <AuthBtnSeller text={"Continue to Review"} style={{ borderRadius: "16px", width: "222px" }} />

            </div>

        </FormWrap>
    )
}

export default SellerInformation