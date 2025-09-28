import arrRight from "../../../assets/sellingIsEasy/arrRight.svg"
import userPlus from "../../../assets/howItWorks/userPlus.svg"
import document from "../../../assets/howItWorks/document.svg"
import upload from "../../../assets/howItWorks/upload.svg"
import home from "../../../assets/howItWorks/home.svg"


import Step from "../../../ui/general/step/Step"

import styles from "./Steps.module.scss"

const Steps = () => {

    const steps = [
        {
            image: userPlus,
            num: 1,
            color: "#fdc700",
            title: "Contact Our Manager ",
            desc: " Send us an email and share your business details."
        },
        {
            image: document,
            num: 2,
            color: "#ff6467",
            title: "Sign Agreement ",
            desc: "Simple, transparent terms."
        },
        {
            image: upload,
            num: 3,
            color: "#05df72",
            title: "Send Product Info",
            desc: "Share your product catalog, photos, and prices. Our moderators upload and optimize your listings."
        },
        {
            image: home,
            num: 4,
            color: "#51a2ff",
            title: "Start Selling and Get Paid",
            desc: " Your products go live, and you receive payouts"
        },
    ]

    return (
        <div className={styles.main}>
            {steps.map((item, index) => (
                <div className={styles.step}>
                    <Step image={item.image} color={item.color} num={item.num} />
                    <p className={styles.title}>{item.title}</p>
                    <p className={styles.desc}>{item.desc}</p>
                    {
                        index !== 3 &&
                        <img className={styles.arrow} src={arrRight} alt="" />
                    }
                </div>

            ))}

        </div>
    )
}

export default Steps