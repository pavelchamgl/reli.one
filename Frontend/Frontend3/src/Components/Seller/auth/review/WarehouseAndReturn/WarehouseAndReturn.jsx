import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import warehouseIc from "../../../../../assets/Seller/register/warehouseAndReturn.svg"
import { countriesArr } from "../../../../../code/seller";
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"
import PrevDocBtn from "../../../newOrder/prevDocBtn/PrevDocBtn";

import styles from "./WarehouseAndReturn.module.scss"

const WarehouseAndReturn = ({ data, setOpen, isCompany }) => {

    const { selfData, companyData } = useSelector(state => state.selfEmploed)


    const wCountry = countriesArr.find((item) => item.value === data?.wCountry)
    const rCountry = countriesArr.find((item) => item.value === data?.rCountry)

    const storeData = isCompany ? companyData : selfData

    const { t } = useTranslation('onbording')

    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={warehouseIc} alt="" />
                    <h3>{t('onboard.warehouse.review_title')}</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <div className={styles.firstBlock}>
                <div>
                    <p className={styles.title}>{t('onboard.warehouse.title')}</p>
                    <span className={styles.desc}>{`${data?.wStreet}, ${data?.wCity}, ${wCountry?.text || ""}, ${data?.wZip_code}`}</span>
                </div>
                <div>
                    <p className={styles.title}>{t('onboard.warehouse.contact_phone')}</p>
                    <span className={`${styles.desc} ${styles.num}`}>{`${data?.contact_phone}`}</span>
                </div>
            </div>

            {
                storeData && storeData?.warehouse_name &&
                <div className={styles.docWrap}>
                    <p className={styles.docTitle}>{t('onboard.tax_address.proof_address')}</p>
                    <PrevDocBtn setOpen={setOpen} text={storeData?.warehouse_name} />
                </div>
            }

            <span className={styles.devider}></span>

            <div className={styles.lastBlock}>
                {
                    data?.same_as_warehouse ?
                        <div>
                            <p className={styles.title}>{t('onboard.return.title')}</p>
                            <span className={styles.desc}>{t('onboard.return.same_as_warehouse')}</span>
                        </div>
                        :
                        <>
                            <div>
                                <p className={styles.title}>{t('onboard.return.title')}</p>
                                <span className={styles.desc}>
                                    {`${data?.rStreet}, ${data?.rCity}, ${rCountry?.text || ""}, ${data?.rZip_code}`}
                                </span>
                            </div>

                            <div>
                                <p className={styles.title}>{t('onboard.warehouse.contact_phone')}</p>
                                <span className={styles.desc}>{data?.rContact_phone}</span>
                            </div>
                        </>
                }
            </div>
        </div>
    )
}

export default WarehouseAndReturn