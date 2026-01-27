import { useTranslation } from "react-i18next"

import send from "../../../assets/sellingIsEasy/send.svg"
import upload from "../../../assets/sellingIsEasy/upload.svg"
import sell from "../../../assets/sellingIsEasy/sell.svg"
import arrRight from "../../../assets/sellingIsEasy/arrRight.svg"
import logo from "../../../assets/sellingIsEasy/logo.svg"
import Step from "../../../ui/general/step/Step"

import styles from "./Steps.module.scss"

const Steps = () => {
    const { t } = useTranslation("blocks")


    const images = [
        {
            image: send,
            text: t("selling.steps.step1"),
            num: 1,
            color: "#fdc700"
        },
        {
            image: upload,
            text: t("selling.steps.step2"),
            num: 2,
            color: "#05df72"
        },
        {
            image: sell,
            text: t("selling.steps.step3"),
            num: 3,
            color: "#51a2ff"
        }
    ]

    return (
        <div className={styles.mainWrap}>
            {images.map((item) => (
                <div className={styles.stepWithArr}>
                    <div className={styles.stepWrap}>
                        <Step image={item.image} num={item.num} color={item.color} />
                        <p className={styles.stepText}>{item.text}</p>
                    </div>
                    <div className={styles.arrow}>
                        <img src={arrRight} alt="" />
                    </div>
                </div>
            ))}
            <div className={styles.stepWrap}>
                <div className={styles.logoImg}>
                    <img src={logo} alt="" />
                </div>
                <p className={styles.stepText}>Reli</p>
            </div>

        </div>
    )
}

export default Steps