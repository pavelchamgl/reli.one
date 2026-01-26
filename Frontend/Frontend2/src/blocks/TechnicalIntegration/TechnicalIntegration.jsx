import { useTranslation } from "react-i18next"

import Container from "../../components/Container/Container"
import SupportBlocks from "../../components/SupportBlocks/SupportBlocks"

import camera from "../../assets/tehnicalIntegration/camera.svg"
import moln from "../../assets/tehnicalIntegration/moln.svg"
import net from "../../assets/tehnicalIntegration/net.svg"

import styles from "./TechnicalIntegration.module.scss"

const TechnicalIntegration = () => {

    const { t } = useTranslation("blocks")


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
            title: t("technical_support.integrations.block1.title"),
            desc: t("technical_support.integrations.block1.description"),
            style: style,
            textStyle: textStyle
        },
        {
            img: moln,
            title: t("technical_support.integrations.block2.title"),
            desc: t("technical_support.integrations.block2.description"),
            style: style,
            textStyle: textStyle
        },
        {
            img: net,
            title: t("technical_support.integrations.block3.title"),
            desc: t("technical_support.integrations.block3.description"),
            style: style,
            textStyle: textStyle
        }
    ]

    const title = t("technical_support.title_small")
    const desc = t("technical_support.main_title")

    return (
        <Container>
            <section className={styles.main}>
                <SupportBlocks title={title} desc={desc} blocks={blocks} />
                <p className={styles.needHelp}>{t("technical_support.help_text")}</p>
                <a href="#get-in-touch" className={styles.contactInfo}>{t("technical_support.contact_link")}</a>
            </section>
        </Container>
    )

}

export default TechnicalIntegration