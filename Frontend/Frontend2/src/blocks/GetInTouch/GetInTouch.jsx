import Container from "../../components/Container/Container"
import ContactInfo from "../../components/GetInTouch/ContactInfo/ContactInfo"
import MessageForm from "../../components/GetInTouch/MessageForm/MessageForm"
import styles from "./GetInTouch.module.scss"

const GetInTouch = () => {
    return (
        <div className={styles.wrap}>
            <Container>
                <section className={styles.main}>
                    <h3 className={styles.title}>Get in Touch</h3>
                    <p className={styles.desc}>Have questions? Our team is here to help you succeed on Reli.one.</p>

                    <div className={styles.blocksWrap}>
                        <ContactInfo />
                        <MessageForm />
                    </div>
                </section>
            </Container>
        </div>
    )
}

export default GetInTouch