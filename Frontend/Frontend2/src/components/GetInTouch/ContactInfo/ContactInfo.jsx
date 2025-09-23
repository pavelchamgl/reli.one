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

    const contacts = [
        {
            img: phone,
            title: "Phone Support",
            desc: "+420 797 837 856"
        },
        {
            img: mail,
            title: "Email Support",
            desc: "office@reli.one"
        },
        {
            img: message,
            title: "Live Chat",
            desc: "Available 24/7 in your dashboard"
        },
        {
            img: time,
            title: "Support Hours",
            desc: "Monday - Sunday, 24/7"
        },
    ]

    return (
        <div>
            <h4 className={styles.title}>Contact Information</h4>
            <div className={styles.blocks}>
                {contacts.map((item) => (
                    <ContactBlock item={item} />
                ))}
            </div>
        </div>
    )
}

export default ContactInfo