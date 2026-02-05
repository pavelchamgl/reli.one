import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import AccountInfo from "../../Components/Seller/auth/review/accountInfo/AccountInfo"
import FormWrap from "../../ui/Seller/auth/formWrap/FormWrap"
import TitleAndDesc from "../../ui/Seller/auth/titleAndDesc/TitleAndDesc"
import StepWrap from "../../ui/Seller/register/stepWrap/StepWrap"
import PersonalDetails from "../../Components/Seller/auth/review/personalDetails/PersonalDetails"
import BusinessAddress from "../../Components/Seller/auth/review/businessAddress/BusinessAddress"
import BankAccount from "../../Components/Seller/auth/review/bankAccount/BankAccount"
import WarehouseAndReturn from "../../Components/Seller/auth/review/WarehouseAndReturn/WarehouseAndReturn"
import SubBtn from "../../ui/Seller/review/subBtn/SubBtn"
import { getReviewOnboarding, postSubmitOnboarding } from "../../api/seller/onboarding"
import { ErrToast } from "../../ui/Toastify"

import styles from "./ReviewInfoPage.module.scss"

const ReviewInfoPage = () => {

    const { selfData } = useSelector(state => state.selfEmploed)


    const navigate = useNavigate()

    useEffect(() => {
        getReviewOnboarding()
    }, [])

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
            const res = await postSubmitOnboarding();
            console.log(res);

            navigate("/seller/application-sub")

        } catch (error) {
            const responseData = error?.response?.data;

            const messages = parseApiErrors(responseData);

            messages.forEach((msg) => ErrToast(msg));
            navigate("/seller/seller-info")
        }
    };



    return (
        <FormWrap style={{ height: "100%" }}>
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <TitleAndDesc title={"Review Your Information"}
                        desc={"Please review all information before submitting your application"} />

                    <StepWrap step={5} />

                </div>

                <AccountInfo data={selfData} />

                <PersonalDetails data={selfData} />

                <BusinessAddress data={selfData} />

                <BankAccount data={selfData} />

                <WarehouseAndReturn data={selfData} />

                <SubBtn onClick={handleSubmit} />

            </div>
        </FormWrap>
    )
}

export default ReviewInfoPage