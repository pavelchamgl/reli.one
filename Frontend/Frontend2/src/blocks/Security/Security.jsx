import Container from "../../components/Container/Container"
import SupportBlocks from "../../components/SupportBlocks/SupportBlocks"

import shield from "../../assets/security/shield.svg"
import document from "../../assets/security/document.svg"
import lock from "../../assets/security/lock.svg"

import styles from "./Security.module.scss"

const Security = () => {

    const style = {
        background: "linear-gradient(160deg, #f9fafb 0%, #f0fdf4 100%)",
        borderRadius: "13px",
        width: "308px",
        height: "183px",
        padding: "21px"
    }

    const textStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "6.5px",
        marginBlock: "13px"
    }

    const blocks = [
        {
            img: shield,
            title: "SSL Encryption",
            desc: "All transactions are protected with industry-standard SSL",
            style: style,
            textStyle: textStyle
        },
        {
            img: document,
            title: "GDPR Compliant",
            desc: "Your business and customer data stay secure under EU regulations",
            style: style,
            textStyle: textStyle
        },
        {
            img: lock,
            title: "Secure Payments",
            desc: "Stripe and PayPal with PCI DSS compliance ensure safe transactions",
            style: style,
            textStyle: textStyle
        }
    ]

    const title = "Security & Reliability"
    const desc = "Your business, Protected. We guarantee safe transactions and data security"

    return (
        <Container >
            <section className={styles.main}>
                <SupportBlocks title={title} desc={desc} blocks={blocks} />
            </section>
        </Container>
    )
}

export default Security