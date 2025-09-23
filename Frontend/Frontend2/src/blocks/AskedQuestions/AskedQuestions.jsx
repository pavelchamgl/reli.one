import Accordion from "../../components/AskedQuestions/Accordion/Accordion"
import Container from "../../components/Container/Container"

import styles from "./AskedQuestions.module.scss"

const AskedQuestions = () => {

    const accArr = [
        {
            title: "Do I need to upload products myself?",
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: "How much does it cost to start?",
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: "Can I sell if I already have a shop or distributor?",
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: "Can I promote my products?",
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: "What product categories do you accept?",
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
    ]
    return (
        <Container>
            <section className={styles.main}>
                <h3 className={styles.title}>Frequently Asked Questions</h3>
                <p className={styles.desc}>Get answers to common questions about selling on Reli.one.</p>

                <div className={styles.accWrap}>
                    {accArr.map((item) => (
                        <Accordion title={item.title} text={item.desc} />
                    ))}
                </div>

                <p className={styles.haveQues}>Still have questions?</p>
                <a href="#" className={styles.readMore}>Read more</a>

            </section>
        </Container>
    )
}

export default AskedQuestions