import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import { countriesArr } from "../../../../../code/seller";
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"
import PrevDocBtn from "../../../newOrder/prevDocBtn/PrevDocBtn";

import styles from "./BusinessAddress.module.scss"

const BusinessAddress = ({ data, setOpen, isCompany }) => {

    const { pathname } = useLocation()
    const { selfData, companyData } = useSelector(state => state.selfEmploed)

    const country = countriesArr.find((item) => item.value === data?.country)

    const storeData = isCompany ? companyData : selfData

    const addressName = isCompany
        ? storeData?.company_address_name
        : storeData?.self_address_name;

    const { t } = useTranslation('onbording')


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={addressIc} alt="" />
                    <h3>
                        {pathname === "/seller/seller-review"
                            ? t('onboard.tax_address.title_simple')
                            : t('onboard.tax_address.title_business')}
                    </h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>{t('onboard.tax_address.street')}</p>
                    <span>{`${data?.street}`}</span>
                </li>
                <li>
                    <p>{t('onboard.tax_address.city')}</p>
                    <span>{`${data?.city}`}</span>
                </li>
                <li>
                    <p>{t('onboard.tax_address.zip')}</p>
                    <span>{`${data?.zip_code}`}</span>
                </li>
                <li>
                    <p>{t('onboard.tax_address.country')}</p>
                    <span>{`${country?.text || ""}`}</span>
                </li>
            </ul>

            {addressName && (
                <div>
                    <p className={styles.docTitle}>{t('onboard.tax_address.proof_address')}</p>
                    <PrevDocBtn setOpen={setOpen} text={addressName} />
                </div>
            )}
        </div>
    )
}

export default BusinessAddress