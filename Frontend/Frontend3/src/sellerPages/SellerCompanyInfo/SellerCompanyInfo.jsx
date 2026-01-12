import { useFormik } from 'formik'
import styles from "./SellerCompanyInfo.module.scss"
import TitleAndDesc from '../../ui/Seller/auth/titleAndDesc/TitleAndDesc';
import StepWrap from '../../ui/Seller/register/stepWrap/StepWrap';
import WhareHouseAddress from '../../Components/Seller/auth/sellerInfo/WareHouseAddress/WhareHouseAddress';
import ReturnAddress from '../../Components/Seller/auth/sellerInfo/ReturnAddress/ReturnAddress';
import AuthBtnSeller from '../../ui/Seller/auth/authBtnSeller/AuthBtnSeller';
import FormWrap from '../../ui/Seller/auth/formWrap/FormWrap';
import BankAccount from '../../Components/Seller/auth/sellerInfo/BankAccount/BankAccount';
import CompanyAddress from '../../Components/Seller/auth/sellerInfo/CompanyAddress/CompanyAddress';
import CompanyInfo from '../../Components/Seller/auth/sellerInfo/CompanyInfo/CompanyInfo';
import Representative from '../../Components/Seller/auth/sellerInfo/Representative/Representative';

const SellerCompanyInfo = () => {

    const formik = useFormik({
        initialValues: {

        },
        onSubmit: (values) => {
            console.log(values);

        }
    })

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Seller Information"}
                        desc={"Please provide all required information for verification"} />

                    <StepWrap step={4} />

                </div>

                <CompanyInfo formik={formik} />
                <Representative formik={formik} />


                <CompanyAddress formik={formik} />

                <BankAccount formik={formik} />

                <WhareHouseAddress formik={formik} />

                <ReturnAddress formik={formik} />

                <AuthBtnSeller text={"Continue to Review"} style={{ borderRadius: "16px", width: "222px" }} handleClick={formik.handleSubmit} />

            </div>

        </FormWrap>
    )
}

export default SellerCompanyInfo