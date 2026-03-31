import { useTranslation } from "react-i18next"

import bankIc from "../../../../../assets/Seller/register/bankAcc.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./BankAccount.module.scss"

const BankAccount = ({ data, setOpen }) => {

    const { t } = useTranslation('onbording')

    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={bankIc} alt="" />
                    <h3>{t('onboard.bank.title')}</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>
            <ul className={styles.infoList}>
                <li>
                    <p>{t('onboard.bank.swift')}</p>
                    <span className={styles.num}>{data?.swift_bic}</span>
                </li>
                <li>
                    <p>{t('onboard.bank.holder')}</p>
                    <span className={styles.num}>{data?.account_holder}</span>
                </li>
                <li>
                    <p>{t('onboard.bank.iban')}</p>
                    <span className={styles.num}>{data?.iban}</span>
                </li>
                {
                    data?.bank_code &&
                    <li>
                        <p>{t('onboard.bank.bank_code')}</p>
                        <span className={styles.num}>{data?.bank_code}</span>
                    </li>
                }
                {
                    data?.local_account_number &&
                    <li>
                        <p>{t('onboard.bank.local_acc')}</p>
                        <span className={styles.num}>{data?.local_account_number}</span>
                    </li>
                }
            </ul>
        </div>
    )
}

export default BankAccount