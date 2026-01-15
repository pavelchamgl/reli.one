import { useSelector } from "react-redux"

import WarehouseAndReturn from "../../Components/Seller/auth/review/WarehouseAndReturn/WarehouseAndReturn"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import SubBtn from "../../ui/Seller/review/subBtn/SubBtn"

import styles from "./SellerReviewCompany.module.scss"
import BankAccount from "../../Components/Seller/auth/review/bankAccount/BankAccount"
import AccountInfo from "../../Components/Seller/auth/review/accountInfo/AccountInfo"
import BusinessAddress from "../../Components/Seller/auth/review/businessAddress/BusinessAddress"
import CompanyInfo from "../../Components/Seller/auth/review/companyInfo/CompanyInfo"
import { getReviewOnboarding, postSubmitOnboarding } from "../../api/seller/onboarding"
import { useEffect } from "react"
import { ErrToast } from "../../ui/Toastify"
import { useNavigate } from "react-router-dom"

const SellerReviewCompany = () => {

    const { companyData } = useSelector(state => state.selfEmploed)

    useEffect(() => {
        getReviewOnboarding()
    }, [])

    const navigate = useNavigate()

    const parseApiErrors = (data) => {
        if (!data) return ["Unknown error"];

        // detail / message
        if (typeof data === "string") return [data];
        if (data.detail) return [data.detail];
        if (data.message) return [data.message];

        // field errors
        if (typeof data === "object") {
            return Object.values(data).flatMap((value) => {
                if (Array.isArray(value)) return value;
                if (typeof value === "string") return [value];
                return [];
            });
        }

        return ["Unexpected error"];
    };

    const handleSubmit = async () => {
        try {
            const res = await postSubmitOnboarding()
            console.log(res);

            navigate("/seller/application-sub")

        } catch (error) {
            console.log(error);

            const responseData = error?.response?.data;

            const messages = parseApiErrors(responseData);

            messages.forEach((msg) => ErrToast(msg));

        }
    }

    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Review Your Information"}
                        desc={"Please review all information before submitting your application"} />

                    <StepWrap step={5} />

                </div>

                <AccountInfo data={companyData} />
                <CompanyInfo data={companyData} />

                <BusinessAddress data={companyData} />

                <BankAccount data={companyData} />

                <WarehouseAndReturn data={companyData} />

                <SubBtn onClick={handleSubmit} />

            </div>
        </FormWrap>
    )
}

export default SellerReviewCompany