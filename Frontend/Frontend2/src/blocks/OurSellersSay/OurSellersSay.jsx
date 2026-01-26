import { useTranslation } from 'react-i18next'

import Container from '../../components/Container/Container'
import star from "../../assets/ourSellers/star.svg"
import milano from "../../assets/ourSellers/milano.svg"
import nutristar from "../../assets/ourSellers/nutristar.svg"
import quotes from "../../assets/ourSellers/quotes.svg"

import styles from "./OurSellersSay.module.scss"

const Stars = () => {
    const arr = [0, 0, 0, 0, 0]
    return (
        <div className={styles.starsWrap}>
            {arr.map((item) => (
                <img src={star} alt="" />
            ))}
        </div>
    )
}

const Comment = ({ img, quote, name, companyTask }) => {
    return (
        <div className={styles.comment}>
            <div className={styles.commentQuote}>
                <img src={quotes} alt="" />
                <p>{quote}</p>
            </div>
            <div className={styles.commentCompany}>
                <img src={img} alt="" />
                <div>
                    <p>{name}</p>
                    <p>{companyTask}</p>
                    <Stars />
                </div>
            </div>
        </div>
    )
}

const OurSellersSay = () => {

    const { t } = useTranslation("blocks")


    const comments = [
        {
            img: nutristar,
            quotes: t("testimonials_section.testimonials.comment1.quote"),
            name: t("testimonials_section.testimonials.comment1.author"),
            companyTasks: t("testimonials_section.testimonials.comment1.category")
        },
        {
            img: milano,
            quotes: t("testimonials_section.testimonials.comment2.quote"),
            name: t("testimonials_section.testimonials.comment2.author"),
            companyTasks: t("testimonials_section.testimonials.comment2.category")
        }
    ]

    return (
        <Container>
            <section className={styles.main}>
                <h3 className={styles.title}>{t("testimonials_section.title_small")}</h3>
                <p className={styles.desc}>{t("testimonials_section.subtitle")}</p>
                <div className={styles.comments}>
                    {comments.map((item) => (
                        <Comment img={item.img} companyTask={item.companyTasks} name={item.name} quote={item.quotes} />
                    ))}
                </div>
            </section>
        </Container>
    )
}

export default OurSellersSay