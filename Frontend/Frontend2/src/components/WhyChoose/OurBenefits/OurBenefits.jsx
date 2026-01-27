import { useTranslation } from "react-i18next"

import moln from "../../../assets/whyChoose/moln.svg"
import headPhone from "../../../assets/whyChoose/headphone.svg"
import dollar from "../../../assets/whyChoose/dollar.svg"
import shield from "../../../assets/whyChoose/shield.svg"
import graph from "../../../assets/whyChoose/graph.svg"
import users from "../../../assets/whyChoose/users.svg"
import Benefits from "../Benefits/Benefits"

import styles from "./OurBenefits.module.scss"




const OurBenefits = () => {

    const { t } = useTranslation("blocks")


    const benefits = [
        {
            img: moln,
            postText: t("why_choose_reli.features.block1.label"),
            title: t("why_choose_reli.features.block1.title"),
            desc: t("why_choose_reli.features.block1.text"),
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #ffdf20 0%, #ffb86a 100%)"
            }
        },
        {
            img: headPhone,
            postText: t("why_choose_reli.features.block2.label"),
            title: t("why_choose_reli.features.block2.title"),
            desc: t("why_choose_reli.features.block2.text"),
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #ffa2a2 0%, #ff6467 100%)"
            }
        },
        {
            img: dollar,
            postText: t("why_choose_reli.features.block3.label"),
            title: t("why_choose_reli.features.block3.title"),
            desc: t("why_choose_reli.features.block3.text"),
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #7bf1a8 0%, #05df72 100%)"
            }
        },
        {
            img: shield,
            postText: t("why_choose_reli.features.block4.label"),
            title: t("why_choose_reli.features.block4.title"),
            desc: t("why_choose_reli.features.block4.text"),
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #51a2ff 0%, #2b7fff 100%)"
            }
        },
        {
            img: graph,
            postText: t("why_choose_reli.features.block5.label"),
            title: t("why_choose_reli.features.block5.title"),
            desc: t("why_choose_reli.features.block5.text"),
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #6584b9 0%, #325bae 100%)"
            }
        },
        {
            img: users,
            postText: t("why_choose_reli.features.block6.label"),
            title: t("why_choose_reli.features.block6.title"),
            desc: t("why_choose_reli.features.block6.text"),
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #ffdf20 0%, #ffb86a 100%)"
            }
        },
    ]

    return (
        <div className={styles.main}>
            {benefits.map((item) => (
                <Benefits title={item.title} desc={item.desc} image={item.img} posText={item.postText} style={item.style} />
            ))}
        </div>
    )
}

export default OurBenefits