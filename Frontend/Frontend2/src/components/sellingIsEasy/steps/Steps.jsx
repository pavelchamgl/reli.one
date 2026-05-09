import { useTranslation } from "react-i18next"

import send from "../../../assets/sellingIsEasy/send.svg"
import upload from "../../../assets/sellingIsEasy/upload.svg"
// import sell from "../../../assets/sellingIsEasy/sell.svg"
import sell2 from "../../../assets/sellingIsEasy/sell2.svg"
import arrRight from "../../../assets/sellingIsEasy/arrRight.svg"
import arrRight2 from "../../../assets/sellingIsEasy/arrRight2.svg"
import logo from "../../../assets/sellingIsEasy/logo.svg"
import Step from "../../../ui/general/step/Step"

import styles from "./Steps.module.scss"

const Steps = () => {
    const { t } = useTranslation("blocks")


    const images = [
        {
                        image: upload,

            text: t("selling.steps.step1"),
            num: 1,
            color: "#51a2ff"
        },
        {
                        image: send,

            text: t("selling.steps.step2"),
            num: 2,
            color: "#fdc700"
        },
        // {
        //     image: sell,
        //     text: t("selling.steps.step3"),
        //     num: 3,
        //     color: "#51a2ff"
        // }
        {
            image: sell2,
            text: t("selling.steps.step4"),
            num: 3,
            color: "#05df72"
        }
    ]

    return (
        <div className={styles.mainWrap}>
            {images.map((item, index) => (
                <div key={index} className={styles.stepWithArr}>
                    <div className={styles.stepWrap}>
                        <Step image={item.image} num={item.num} color={item.color} />
                        <p className={styles.stepText}>{item.text}</p>
                    </div>
                    {/* <div className={styles.arrow}>
                        <img src={arrRight} alt="" />
                    </div> */}
                    {index !== images.length - 1 && (
                        <div className={styles.arrow}>
                            <img src={arrRight2} alt="" />
                        </div>
                    )}
                </div>
            ))}
            {/* <div className={styles.stepWrap}>
                <div className={styles.logoImg}>
                    <img src={logo} alt="" />
                </div>
                <p className={styles.stepText}>Reli</p>
            </div> */}

        </div>
    )
}

export default Steps