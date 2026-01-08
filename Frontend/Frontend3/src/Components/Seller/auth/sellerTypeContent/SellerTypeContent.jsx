import { useEffect, useState } from 'react'
import TitleAndDesc from '../../../../ui/Seller/auth/titleAndDesc/TitleAndDesc'
import AuthBtnSeller from '../../../../ui/Seller/auth/authBtnSeller/AuthBtnSeller'

import solfIc from "../../../../assets/Seller/register/solfIc.svg"
import companyIc from "../../../../assets/Seller/register/companyIc.svg"
import sellerTypeMark from "../../../../assets/Seller/register/sellerTypeMark.svg"

import styles from "./SellerTypeContent.module.scss"
import StepWrap from '../../../../ui/Seller/register/stepWrap/StepWrap'
import { postSellerType } from '../../../../api/seller/onboarding'
import { ErrToast } from '../../../../ui/Toastify'

const SellerTypeContent = () => {



    const [company, setCompany] = useState(null)

    useEffect(() => {

    }, [])
    // ? для дальнейшей обработки и проверки статуса

    const handleChooseSellerType = async () => {
        if (!company) return;

        try {
            const res = await postSellerType(company);
            console.log("Успех:", res);

        } catch (err) {
            console.log("Ошибка:", err);

            if (err.status === 401) {
                ErrToast("Authentication required.")
                // например редирект на логин
                console.log("Не авторизован");
            }

            if (err.status === 403) {
                ErrToast("Access denied.")
                console.log("Нет доступа");
            }

            ErrToast(err?.message)
        }
    };



    return (
        <div className={styles.mainWrap}>
            <TitleAndDesc title={"Choose Your Seller Type"}
                desc={"Select the option that best describes your business"} />

            <StepWrap step={1} />

            <div className={styles.typeBtnWrap}>
                <button
                    onClick={() => {
                        setCompany("self_employed")
                    }}
                    style={{
                        border: company === "self_employed" ? "1.33px solid #3f7f6d" : ""
                    }} className={styles.typeBtn}>
                    <img src={solfIc} alt="" />
                    <h4>Self-employed / Sole proprietor</h4>
                    <p>For individuals running a small business or operating independently.</p>

                    {
                        company === "self_employed" &&
                        <img className={styles.sellerTypeMark} src={sellerTypeMark} alt="" />
                    }
                </button>

                <button
                    onClick={() => {
                        setCompany("company")
                    }}
                    style={{
                        border: company === "company" ? "1.33px solid #3f7f6d" : ""
                    }} className={styles.typeBtn}
                >
                    <img src={companyIc} alt="" />
                    <h4>Company / Legal entity</h4>
                    <p>For officially registered companies and legal entities.</p>

                    {
                        company === "company" &&
                        <img className={styles.sellerTypeMark} src={sellerTypeMark} alt="" />
                    }
                </button>

            </div>

            {
                company ?
                    <AuthBtnSeller disabled={!company} handleClick={handleChooseSellerType} style={{
                        maxWidth: "123px",
                        borderRadius: "16px"
                    }} text={"Continue"} />
                    :
                    null

            }



        </div>
    )
}

export default SellerTypeContent