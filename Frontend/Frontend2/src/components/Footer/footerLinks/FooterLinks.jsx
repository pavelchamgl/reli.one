import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import logo from "../../../assets/footerNew/logo.svg"
import face from "../../../assets/footerNew/face.svg"
import tel from "../../../assets/footerNew/tel.svg"
import insta from "../../../assets/footerNew/insta.svg"
import linkedin from "../../../assets/footerNew/linkedin.svg"
import tiktok from "../../../assets/footerNew/tiktok.svg"

import styles from "./FooterLinks.module.scss"

const FooterLinks = () => {

    const { t } = useTranslation("footer")


    const links1 = [
        {
            title: t("footer.columns.for_sellers.links.link1"),
            url: "https://reli.one/seller/create-account"
        },
        {
            title: t("footer.columns.for_sellers.links.link2"),
            url: "https://reli.one/seller/login"
        },
        {
            title: t("footer.columns.for_sellers.links.link3"),
            url: "/pricing-commission"
        },
        {
            title: t("footer.columns.for_sellers.links.link4"),
            url: "#"
        }
    ]
    // const links2 = ["About Us", "Careers", "Press ", "Contact ", "Blog "]
    const links2 = [
        t("footer.columns.legal.links.link1"),
        t("footer.columns.legal.links.link2"),
        t("footer.columns.legal.links.link3"),
        t("footer.columns.legal.links.link4"),
        t("footer.columns.legal.links.link5"),
        t("footer.columns.legal.links.link6"),
        t("footer.columns.legal.links.link7"),
    ]


    return (
        <div className={styles.main}>
            <div className={styles.logoWrap}>
                <img src={logo} alt="" />
                <p className={styles.footerDesc}>{t("footer.logo_text")}</p>
                <div className={styles.companyInfoWrap}>
                    <p>{t("footer.company_info.company_id")}</p>
                    <p>{t("footer.company_info.vat")}</p>
                    <p>{t("footer.company_info.phone")}</p>
                    <p>{t("footer.company_info.email")}</p>
                </div>
                <p className={styles.footerDesc}>{t("footer.company_info.address")}</p>

                <div className={styles.linksWrap}>
                    <a href="#">
                        <img src={face} alt="" />
                    </a>
                    {/* <a href="#">
                        <img src={tel} alt="" />
                    </a> */}
                    <a href="#">
                        <img src={insta} alt="" />
                    </a>
                    <a href="#">
                        <img src={linkedin} alt="" />
                    </a>
                    <a href="#">
                        <img src={tiktok} alt="" />
                    </a>
                </div>

            </div>
            <ul>
                {/* <li>
                    <h3 className={styles.listTitle}>For Sellers</h3>
                </li> */}
                <li>
                    <Link className={styles.listTitle} to={"/for-sell"}>{t("footer.columns.for_sellers.title")}</Link>
                </li>
                {links1.map((item) => (
                    <li><Link className={styles.listItem} to={item.url}>{item.title}</Link></li>
                ))}
            </ul>
            <ul>
                <li>
                    <h3 className={styles.listTitle}>{t("footer.columns.legal.title")}</h3>
                </li>
                {links2.map((item) => (
                    <li><a className={styles.listItem} href="#">{item}</a></li>
                ))}
            </ul>
            <ul>
                <li>
                    <h3 className={styles.listTitle}>{t("footer.columns.company.title")}</h3>
                </li>
                <li>
                    <Link className={styles.listItem} to={"/about"}>{t("footer.columns.company.links.link1")}</Link>
                </li>
                <li>
                    <Link className={styles.listItem} to={"/contact"}>{t("footer.columns.company.links.link2")}</Link>
                </li>
            </ul>
            {/* <div className={styles.bankDetailWrap}>
                <p>Banking details:</p>
                <p>DIČ: CZ28003896</p>
                <p>Bank: Raiffeisen Bank</p>
                <p>SWIFT (BIC): RZBCCZPP</p>
                <p>Account number/bank code: 5003011074/5500</p>
                <p>Company Identification Number: 28003896</p>
                <p>IBAN: CZ9455000000005003011074</p>
            </div> */}
            {/* <ul>
                <li>
                    <h3 className={styles.listTitle}>Legal</h3>
                </li>
                {links4.map((item) => (
                    <li><a className={styles.listItem} href="#">{item}</a></li>
                ))}
            </ul> */}

        </div>
    )
}

export default FooterLinks