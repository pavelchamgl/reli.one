import { useTranslation } from "react-i18next"

import Accordion from "../../components/AskedQuestions/Accordion/Accordion"
import Container from "../../components/Container/Container"

import styles from "./AskedQuestions.module.scss"

const AskedQuestions = () => {

    const { t } = useTranslation("blocks")


    const accArr = [
        {
            title: t("faq_section.questions.ques1"),
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: t("faq_section.questions.ques2"),
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: t("faq_section.questions.ques3"),
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: t("faq_section.questions.ques4"),
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
        {
            title: t("faq_section.questions.ques5"),
            desc: "No – our managers handle everything. You just send us all the information about your products and we take care of the rest."
        },
    ]
    return (
        <Container>
            <section className={styles.main}>
                <h3 className={styles.title}>{t("faq_section.main_title")}</h3>
                <p className={styles.desc}>{t("faq_section.subtitle")}</p>

                <div className={styles.accWrap}>
                    {accArr.map((item) => (
                        <Accordion title={item.title} text={item.desc} />
                    ))}
                </div>

                <p className={styles.haveQues}>{t("faq_section.bottom_text")}</p>
                <a className={styles.readMore}>{t("faq_section.bottom_link")}</a>

            </section>
        </Container>
    )
}

export default AskedQuestions