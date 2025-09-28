import Container from '../../components/Container/Container'
import SupportBlocks from '../../components/SupportBlocks/SupportBlocks'

import book from "../../assets/sellerSupport/book.svg"
import mark from "../../assets/sellerSupport/mark.svg"
import document from "../../assets/sellerSupport/document.svg"

import styles from "./SellerSupport.module.scss"

const SellerSupport = () => {

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
            title: "Onboarding Guide",
            desc: "Step – by – step instructions on how to start selling with zero technical skills.",
            link: "Browse Guides",
            style: style,
            textStyle: textStyle
        },
        {
            img: mark,
            title: "Tips From Our Team",
            desc: "Best practices for pricing, positioning, and growing sales on Reli",
            link: "Contact",
            style: style,
            textStyle: textStyle
        },
        {
            img: document,
            title: "Promotion Opportunities",
            desc: "Discover how we promote your products for free on banners and the main page.",
            link: "Read More",
            style: style,
            textStyle: textStyle
        }
    ]

    const title = "Seller Support and Resources"
    const desc = "We help you succeed from day one."

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