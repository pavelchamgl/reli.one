import { useTranslation } from "react-i18next"

import FooterMain from "../../components/Footer/FooterMain/FooterMain"
import Header from "../../components/Header/Header"
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop"
import WhatsappMeneger from "../../components/WhatsAppManager/WhatsAppManager"

import styles from "./ContactPage.module.scss"

const ContactPage = () => {

    const { t } = useTranslation("contact")


    const companyDetails = [
        {
            title: t("contact_page.company_details.company_name"),
            desc: t("contact_page.company_details.company_name_text")
        },
        {
            title: t("contact_page.company_details.company_id"),
            desc: t("contact_page.company_details.company_id_text"),
            num: true
        },
        {
            title: t("contact_page.company_details.vat"),
            desc: t("contact_page.company_details.vat_text"),
            num: true
        }
    ]

    const contactDetails = [
        {
            title: t("contact_page.contact_details.phone.label"),
            desc: "+420 797 837 856",
            num: true
        },
        {
            title: t("contact_page.contact_details.email.label"),
            desc: "info@reli.one"
        }
    ]

    const banckDetails = [
        {
            title: t("contact_page.banking_details.bank"),
            desc: t("contact_page.banking_details.bank_desc")
        },
        {
            title: t("contact_page.banking_details.iban"),
            desc: t("contact_page.banking_details.iban_desc"),
            num: true
        },
        {
            title: t("contact_page.banking_details.account_number"),
            desc: t("contact_page.banking_details.account_number_desc"),
            num: true
        },
        {
            title: t("contact_page.banking_details.swift"),
            desc: t("contact_page.banking_details.swift_desc")
        },
    ]

    return (
        <>
            <Header />
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <h1>{t("contact_page.title")}</h1>
                    <p>{t("contact_page.subtitle")}</p>
                </div>

                <div className={styles.blocksBordWrap}>
                    <div className={styles.blocksBordWrapFirst}>

                        <div className={`${styles.contactBlockBorder}`}>
                            <h2>{t("contact_page.contact_details.title")}</h2>
                            <ul>
                                {
                                    contactDetails?.map((item) => (
                                        <li>
                                            <p>{item.title}</p>
                                            <span style={{ fontFamily: item?.num ? "var(--ft)" : "" }}>{item.desc}</span>
                                        </li>

                                    ))
                                }
                            </ul>
                        </div>

                        <div className={`${styles.contactBlockBorder}`}>
                            <h2>{t("contact_page.business_hours.title")}</h2>
                            <p className={styles.hoursDesc}>{t("contact_page.business_hours.description")}</p>
                            <ul>

                                <li className={styles.hoursItems}>
                                    <p>{t("contact_page.business_hours.monday_friday")}</p>
                                    <span>{t("contact_page.business_hours.monday_friday_time")}</span>
                                </li>

                                <li className={styles.hoursItems}>
                                    <p>{t("contact_page.business_hours.saturday_sunday")}</p>
                                    <span>{t("contact_page.business_hours.saturday_sunday_time")}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className={`${styles.contactBlockBorder} ${styles.bigBlock}`}>
                        <h2>{t("contact_page.company_details.title")}</h2>
                        <ul>
                            {
                                companyDetails?.map((item) => (
                                    <li>
                                        <p>{item.title}</p>
                                        <span style={{ fontFamily: item?.num ? "var(--ft)" : "" }}>{item.desc}</span>
                                    </li>

                                ))
                            }
                            <li>
                                <p>{t("contact_page.company_details.address.title")}</p>
                                <span>{t("contact_page.company_details.address.text1")}</span>
                                <span>{t("contact_page.company_details.address.text2")}</span>
                                <span>{t("contact_page.company_details.address.text3")}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className={styles.bankBlockWrap}>
                    <div className={styles.bankBlock}>
                        <h2>{t("contact_page.banking_details.title")}</h2>

                        <ul>
                            {
                                banckDetails?.map((item) => (
                                    <li>
                                        <p>{item.title}</p>
                                        <span style={{ fontFamily: item?.num ? "var(--ft)" : "" }}>{item.desc}</span>
                                    </li>

                                ))
                            }
                        </ul>
                    </div>

                </div>



            </div>

            <FooterMain />
            <ScrollToTop />
            <WhatsappMeneger />

        </>
    )
}

export default ContactPage