import { Link } from "react-router-dom"

import logo from "../../../assets/footerNew/logo.svg"
import face from "../../../assets/footerNew/face.svg"
import tel from "../../../assets/footerNew/tel.svg"
import insta from "../../../assets/footerNew/insta.svg"
import linkedin from "../../../assets/footerNew/linkedin.svg"
import tiktok from "../../../assets/footerNew/tiktok.svg"

import styles from "./FooterLinks.module.scss"

const FooterLinks = () => {

    const links1 = ["Getting Started", "Seller Dashboard", "Commission Structure", "Payment Methods", "Seller Support"]
    const links2 = ["About Us", "Careers", "Press ", "Contact ", "Blog "]
    const links3 = ["API Documentation", "Integration Guides", "Video Tutorials", "Best Practices", "Community Forum"]
    const links4 = ["Terms of Service", "Privacy Policy", "GDPR Compliance", "Cookie Policy", "Legal Notice"]


    return (
        <div className={styles.main}>
            <div className={styles.logoWrap}>
                <img src={logo} alt="" />
                <p className={styles.footerDesc}>The easiest way to start selling
                    online. Join thousands of
                    successful sellers and grow
                    your business with us.</p>

                <div className={styles.linksWrap}>
                    <a href="#">
                        <img src={face} alt="" />
                    </a>
                    <a href="#">
                        <img src={tel} alt="" />
                    </a>
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
                    <Link className={styles.listTitle} to={"/for-sell"}>For Sellers</Link>
                </li>
                {links1.map((item) => (
                    <li><a className={styles.listItem} href="#">{item}</a></li>
                ))}
            </ul>
            <ul>
                <li>
                    <h3 className={styles.listTitle}>Company</h3>
                </li>
                {links2.map((item) => (
                    <li><a className={styles.listItem} href="#">{item}</a></li>
                ))}
            </ul>
            <ul>
                <li>
                    <h3 className={styles.listTitle}>Resources</h3>
                </li>
                {links3.map((item) => (
                    <li><a className={styles.listItem} href="#">{item}</a></li>
                ))}
            </ul>
            <ul>
                <li>
                    <h3 className={styles.listTitle}>Legal</h3>
                </li>
                {links4.map((item) => (
                    <li><a className={styles.listItem} href="#">{item}</a></li>
                ))}
            </ul>

        </div>
    )
}

export default FooterLinks