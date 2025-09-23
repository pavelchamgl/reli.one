import Container from "../../components/Container/Container"
import SupportBlocks from "../../components/SupportBlocks/SupportBlocks"

import camera from "../../assets/tehnicalIntegration/camera.svg"
import moln from "../../assets/tehnicalIntegration/moln.svg"
import net from "../../assets/tehnicalIntegration/net.svg"

import styles from "./TechnicalIntegration.module.scss"

const TechnicalIntegration = () => {

    const style = {
        borderRadius: "13px",
        width: "308px",
        height: "203px",
        background: "linear-gradient(141deg, #f9fafb 0%, #eff6ff 100%)",
        padding: "21px"
    }

    const textStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "6.4px",
        marginBlock: "13px",
        maxWidth: "186px"
    }

    const blocks = [
        {
            img: camera,
            title: "Payment integrations",
            desc: "Accept payments easily via Stripe and PayPal",
            style: style,
            textStyle: textStyle
        },
        {
            img: moln,
            title: "Easy Setup",
            desc: "Start selling in minutes with our simple onboarding process",
            style: style,
            textStyle: textStyle
        },
        {
            img: net,
            title: "Delivery integrations",
            desc: "Ship with trusted partners like Packeta and GLS",
            style: style,
            textStyle: textStyle
        }
    ]

    const title = "Technical integration & Support"
    const desc = "Connect with your existing tools and platforms for a smooth selling experience."

    return (
        <Container>
            <section className={styles.main}>
                <SupportBlocks title={title} desc={desc} blocks={blocks} />
                <p className={styles.needHelp}>Need help with integration? Our technical team is here to assist.</p>
                <a href="#" className={styles.contactInfo}>Contact Information</a>
            </section>
        </Container>
    )

}

export default TechnicalIntegration