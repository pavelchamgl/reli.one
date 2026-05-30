import { useTranslation } from "react-i18next";

import personalIc from "../../../../../assets/Seller/register/personalDetailsRevies.svg"
import { countriesArr } from "../../../../../code/seller";
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./PersonalDetails.module.scss"

const PersonalDetails = ({ data, setOpen }) => {

    const nationality = countriesArr.find((item) => item?.value === data?.nationality)

    const tax_country = countriesArr.find((item) => item?.value === data?.tax_country)

    const { t } = useTranslation('onbording')


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={personalIc} alt="" />
                    <h3>{t('onboard.review.review_title')}</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>
            <ul className={styles.infoList}>
                <li>
                    <p>{t('onboard.review.tin')}</p>
                    <span className={styles.num}>{data?.tin}</span>
                </li>
                <li>
                    <p>{t('onboard.review.tax_country')}</p>
                    <span>{tax_country?.text}</span>
                </li>
                {
                    data?.ico &&
                    <li>
                        <p>{t('onboard.review.ico')}</p>
                        <span className={styles.num}>{data?.ico}</span>
                    </li>
                }
                {
                    data?.vat_id &&
                    <li>
                        <p>{t('onboard.review.vat_id')}</p>
                        <span className={styles.num}>{data?.vat_id}</span>
                    </li>
                }
            </ul>
        </div>
    )
}

export default PersonalDetails