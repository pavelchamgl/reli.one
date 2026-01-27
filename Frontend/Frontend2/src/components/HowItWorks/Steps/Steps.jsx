import arrRight from "../../../assets/sellingIsEasy/arrRight.svg"
import userPlus from "../../../assets/howItWorks/userPlus.svg"
import document from "../../../assets/howItWorks/document.svg"
import upload from "../../../assets/howItWorks/upload.svg"
import home from "../../../assets/howItWorks/home.svg"


import Step from "../../../ui/general/step/Step"

import styles from "./Steps.module.scss"
import { useTranslation } from "react-i18next"

const Steps = () => {

    const { t } = useTranslation("blocks")


    const steps = [
        {
            image: userPlus,
            num: 1,
            color: "#fdc700",
            title: t("how_it_works.steps.step1.label"),
            desc: t("how_it_works.steps.step1.text")
        },
        {
            image: document,
            num: 2,
            color: "#ff6467",
            title: t("how_it_works.steps.step2.label"),
            desc: t("how_it_works.steps.step2.text")
        },
        {
            image: upload,
            num: 3,
            color: "#05df72",
            title: t("how_it_works.steps.step3.label"),
            desc: t("how_it_works.steps.step3.text")
        },
        {
            image: home,
            num: 4,
            color: "#51a2ff",
            title: t("how_it_works.steps.step4.label"),
            desc: t("how_it_works.steps.step4.text")
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