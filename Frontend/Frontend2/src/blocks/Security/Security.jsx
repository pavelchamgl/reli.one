import { useTranslation } from "react-i18next"

import Container from "../../components/Container/Container"
import SupportBlocks from "../../components/SupportBlocks/SupportBlocks"

import shield from "../../assets/security/shield.svg"
import document from "../../assets/security/document.svg"
import lock from "../../assets/security/lock.svg"

import styles from "./Security.module.scss"

const Security = () => {

    const { t } = useTranslation("blocks")


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
            title: t("security_section.security_features.block1.title"),
            desc: t("security_section.security_features.block1.description"),
            style: style,
            textStyle: textStyle
        },
        {
            img: document,
            title: t("security_section.security_features.block2.title"),
            desc: t("security_section.security_features.block2.description"),
            style: style,
            textStyle: textStyle
        },
        {
            img: lock,
            title: t("security_section.security_features.block3.title"),
            desc: t("security_section.security_features.block3.description"),
            style: style,
            textStyle: textStyle
        }
    ]

    const title = t("security_section.title_small")
    const desc = t("security_section.main_title")

    return (
        <Container >
            <section className={styles.main}>
                <SupportBlocks title={title} desc={desc} blocks={blocks} />
            </section>
        </Container>
    )
}

export default Security