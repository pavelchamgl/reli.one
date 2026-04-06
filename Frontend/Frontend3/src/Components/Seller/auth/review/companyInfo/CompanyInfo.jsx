
import { useSelector } from "react-redux"
import { useTranslation } from "react-i18next"

import companyIc from "../../../../../assets/Seller/register/companyIcon.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"
import { countriesArr } from "../../../../../code/seller"
import PrevDocBtn from "../../../newOrder/prevDocBtn/PrevDocBtn"

import styles from './CompanyInfo.module.scss'

const CompanyInfo = ({ data, setOpen }) => {


    const { registerData, companyData } = useSelector(state => state.selfEmploed)

    const countryOfRegistration = countriesArr.find((item) => item.value === data?.country_of_registration)

    const { t } = useTranslation('onbording')

    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={companyIc} alt="" />
                    <h3>{t('onboard.company.title')}</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>{t('onboard.company.name')}</p>
                    <span>{data?.company_name}</span>
                </li>
                <li>
                    <p>{t('onboard.company.legal_form')}</p>
                    <span>{data?.legal_form}</span>
                </li>
                <li>
                    <p>{t('onboard.company.country_reg')}</p>
                    <span>{countryOfRegistration?.text}</span>
                </li>
                {
                    data?.ico &&
                    <li>
                        <p>IČO</p>
                        <span className={styles.num}>{data?.ico}</span>
                    </li>
                }
                {
                    data?.tin &&
                    <li>
                        <p>{t('onboard.review.tin') || 'TIN'}</p>
                        <span className={styles.num}>{data?.tin}</span>
                    </li>
                }
                {
                    data?.eori_number &&
                    <li>
                        <p>EORI</p>
                        <span className={styles.num}>{data?.eori_number}</span>
                    </li>
                }
                {/* Если Registration Number — это телефон регистрации */}
                <li>
                    <p>{t('onboard.company.reg_number')}</p>
                    <span className={styles.num}>{registerData?.phone ? registerData?.phone : "N/A"}</span>
                </li>
                <li>
                    <p>{t('onboard.company.business_id')}</p>
                    <span className={styles.num}>{data?.business_id}</span>
                </li>
                <li>
                    <p>{t('onboard.company.phone')}</p>
                    <span className={styles.num}>{data?.company_phone ? data?.company_phone : "N/A"}</span>
                </li>
            </ul>

            {
                companyData && companyData?.company_file_date &&
                <div className={styles.docWrap}>
                    <p className={styles.docTitle}>{t('onboard.company.cert_title')}</p>
                    <PrevDocBtn setOpen={setOpen} text={companyData?.company_file_date} />
                </div>
            }
        </div>
    )
}

export default CompanyInfo