import FooterMain from "../../components/Footer/FooterMain/FooterMain"
import Header from "../../components/Header/Header"
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop"
import WhatsappMeneger from "../../components/WhatsAppManager/WhatsAppManager"
import styles from "./ContactPage.module.scss"

const ContactPage = () => {

    const companyDetails = [
        {
            title: "Company Name",
            desc: "Reli Group s.r.o."
        },
        {
            title: "Company ID",
            desc: "28003896",
            num: true
        },
        {
            title: "VAT",
            desc: "CZ28003896",
            num: true
        }
    ]

    const contactDetails = [
        {
            title: "Phone",
            desc: "+420 797 837 856",
            num: true
        },
        {
            title: "Email",
            desc: "info@reli.one"
        }
    ]

    const banckDetails = [
        {
            title: "Bank",
            desc: "Raiffeisen Bank"
        },
        {
            title: "IBAN",
            desc: "CZ9455000000005003011074",
            num: true
        },
        {
            title: "Account Number",
            desc: "8115228001/5500",
            num: true
        },
        {
            title: "SWIFT (BIC)",
            desc: "RZBCCZPP"
        },
    ]

    return (
        <>
            <Header />
            <div className={styles.main}>
                <div className={styles.titleWrap}>
                    <h1>Contact</h1>
                    <p>Get in touch with Reli Group s.r.o.</p>
                </div>

                <div className={styles.blocksBordWrap}>
                    <div className={styles.blocksBordWrapFirst}>

                        <div className={`${styles.contactBlockBorder}`}>
                            <h2>Contact Details</h2>
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
                            <h2>Business Hours</h2>
                            <p className={styles.hoursDesc}>Our team is available to assist you during business hours.</p>
                            <ul>

                                <li className={styles.hoursItems}>
                                    <p>Monday - Friday:</p>
                                    <span>9:00 - 17:00 (CET)</span>
                                </li>

                                <li className={styles.hoursItems}>
                                    <p>Saturday - Sunday:</p>
                                    <span>Closed</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className={`${styles.contactBlockBorder} ${styles.bigBlock}`}>
                        <h2>Company Details</h2>
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
                                <p>Address</p>
                                <span>Na Lysinách 551/34</span>
                                <span>Prague 4 – Hodkovičky</span>
                                <span>147 00, Czech Republic</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className={styles.bankBlockWrap}>
                    <div className={styles.bankBlock}>
                        <h2>Banking Details</h2>

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