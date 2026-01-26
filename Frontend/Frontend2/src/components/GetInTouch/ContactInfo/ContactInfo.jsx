import { useTranslation } from "react-i18next"

import phone from "../../../assets/getInTouch/phone.svg"
import mail from "../../../assets/getInTouch/mail.svg"
import message from "../../../assets/getInTouch/message.svg"
import time from "../../../assets/getInTouch/time.svg"

import styles from "./ContactInfo.module.scss"

const ContactBlock = ({ item }) => {
    return (
        <div className={styles.contactBlock}>
            <img src={item?.img} alt="" />
            <div>
                <h5>{item?.title}</h5>
                <p>{item?.desc}</p>
            </div>
        </div>
    )
}

const ContactInfo = () => {

    const { t } = useTranslation("blocks")


    const contacts = [
        {
            img: phone,
            title: t("contact_section.contact_info.phone.label"),
            desc: t("contact_section.contact_info.phone.value")
        },
        {
            img: mail,
            title: t("contact_section.contact_info.email.label"),
            desc: t("contact_section.contact_info.email.value")
        },
        {
            img: message,
            title: t("contact_section.contact_info.live_chat.label"),
            desc: t("contact_section.contact_info.live_chat.value")
        },
        {
            img: time,
            title: t("contact_section.contact_info.support_hours.label"),
            desc: t("contact_section.contact_info.support_hours.value")
        },
    ]

    return (
        <div>
            <h4 className={styles.title}>{t("contact_section.contact_info.title")}</h4>
            <div className={styles.blocks}>
                {contacts.map((item) => (
                    <ContactBlock item={item} />
                ))}
            </div>
        </div>
    )
}

export default ContactInfo