import { useTranslation } from "react-i18next"

import Container from "../../components/Container/Container"
import ContactInfo from "../../components/GetInTouch/ContactInfo/ContactInfo"
import MessageForm from "../../components/GetInTouch/MessageForm/MessageForm"

import styles from "./GetInTouch.module.scss"

const GetInTouch = () => {
    const { t } = useTranslation("blocks")

    return (
        <div className={styles.wrap} id="get-in-touch">
            <Container>
                <section className={styles.main}>
                    <h3 className={styles.title}>{t("contact_section.title_small")}</h3>
                    <p className={styles.desc}>{t("contact_section.main_title")}</p>

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