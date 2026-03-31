
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"

import accountInfo from "../../../../../assets/Seller/register/accountInfoIc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"
import { countriesArr } from "../../../../../code/seller"
import PrevDocBtn from "../../../newOrder/prevDocBtn/PrevDocBtn"

import styles from "./AccountInfo.module.scss"

const AccountInfo = ({ data, type, isCompany, setOpen }) => {

    const { registerData, selfData, companyData } = useSelector(state => state.selfEmploed)

    const firstName = JSON.parse(localStorage.getItem('first_name')) || ""
    const lastName = JSON.parse(localStorage.getItem('last_name')) || ""
    const phone = JSON.parse(localStorage.getItem('phone')) || ""
    const email = JSON.parse(localStorage.getItem('email')) || ""

    const storeData = isCompany ? companyData : selfData

    const { t } = useTranslation('onbording')


    const nationality = countriesArr.find((item) => item.value === data?.nationality)


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={accountInfo} alt="" />
                    <h3>
                        {isCompany
                            ? t('onboard.review.representative')
                            : t('onboard.review.account_info')}
                    </h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>{t('onboard.review.name')}</p>
                    <span>{`${firstName} ${lastName}`}</span>
                </li>
                <li>
                    <p>{t('onboard.review.dob')}</p>
                    <span className={styles.num}>{`${data?.date_of_birth}`}</span>
                </li>
                <li>
                    <p>{t('onboard.review.email')}</p>
                    <span>{email ? email : "—"}</span>
                </li>
                {
                    isCompany &&
                    <li>
                        <p>{t('onboard.review.role')}</p>
                        <span>{data?.role}</span>
                    </li>
                }
                <li>
                    <p>{t('onboard.review.phone')}</p>
                    <span className={styles.num}>{data?.personal_phone || data?.company_phone}</span>
                </li>
                <li>
                    <p>{t('onboard.review.seller_type')}</p>
                    <span>
                        {type === "company"
                            ? t('onboard.review.type_company')
                            : t('onboard.review.type_self')}
                    </span>
                </li>
            </ul>
            {
                storeData?.front && storeData?.back &&
                <div>
                    <p className={styles.docTitle}>{t('onboard.review.identity_doc')}</p>
                    <div className={styles.twoDocWrap}>
                        <PrevDocBtn setOpen={setOpen} text={storeData?.front} />
                        <PrevDocBtn setOpen={setOpen} text={storeData?.back} />
                    </div>
                </div>
            }
        </div>
    )
}

export default AccountInfo