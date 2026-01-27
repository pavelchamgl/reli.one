import { useTranslation } from 'react-i18next'

import Container from '../../components/Container/Container'
import SupportBlocks from '../../components/SupportBlocks/SupportBlocks'

import book from "../../assets/sellerSupport/book.svg"
import mark from "../../assets/sellerSupport/mark.svg"
import document from "../../assets/sellerSupport/document.svg"

import styles from "./SellerSupport.module.scss"

const SellerSupport = () => {

    const { t } = useTranslation("blocks")


    const style = {
        borderRadius: "14px",
        width: "308px",
        height: "276px",
        boxShadow: "0 4px 6px -4px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        background: "#fff",
        padding: "28px"
    }

    const textStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "13.5px",
        marginBlock: "21px"
    }

    const blocks = [
        {
            img: book,
            title: t("seller_support.resources.block1.title"),
            desc: t("seller_support.resources.block1.description"),
            link: t("seller_support.resources.block1.button"),
            style: style,
            textStyle: textStyle
        },
        {
            img: mark,
            title: t("seller_support.resources.block2.title"),
            desc: t("seller_support.resources.block2.description"),
            link: t("seller_support.resources.block2.button"),
            url: "#get-in-touch",
            style: style,
            textStyle: textStyle
        },
        {
            img: document,
            title: t("seller_support.resources.block3.title"),
            desc: t("seller_support.resources.block3.description"),
            link: t("seller_support.resources.block3.button"),
            style: style,
            textStyle: textStyle
        }
    ]

    const title = t("seller_support.title_small")
    const desc = t("seller_support.main_title")

    return (
        <div className={styles.wrap}>
            <Container>
                <section>
                    <SupportBlocks title={title} desc={desc} blocks={blocks} />
                </section>
            </Container>
        </div>
    )
}

export default SellerSupport