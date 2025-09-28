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

    const comments = [
        {
            img: nutristar,
            quotes: '"Reli.one made it incredibly easy to start selling online. The setup was quick, and I saw my first sale within hours. The support team is amazing!"',
            name: "Nutristar",
            companyTasks: "Balanced vitamin complexes"
        },
        {
            img: milano,
            quotes: '"The analytics tools help me understand my customers better. Sales have increased by 300% since joining Reli.one. Best decision for my business."',
            name: "Milano Cosmetics",
            companyTasks: "Cosmetics"
        }
    ]

    return (
        <Container>
            <section className={styles.main}>
                <h3 className={styles.title}>What Our Sellers Say</h3>
                <p className={styles.desc}>Join thousands of successful sellers who have grown their business with
                    Reli.one.</p>
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