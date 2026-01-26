import { useTranslation } from "react-i18next"

import dollar from "../../../assets/transperetnPricing/dollar.svg"
import shield from "../../../assets/transperetnPricing/shield.svg"
import time from "../../../assets/transperetnPricing/time.svg"

import styles from "./Benefits.module.scss"


const BenefitsBlock = ({ img, title, desc, style }) => {
    return (
        <div className={styles.block} style={style}>
            <img src={img} alt="" />
            <div>
                <h6>{title}</h6>
                <p>{desc}</p>
            </div>
        </div>
    )
}

const Benefits = () => {

    const { t } = useTranslation("blocks")


    const blocks = [
        {
            img: dollar,
            title: t("pricing_section.commission_structure.block1.title"),
            desc: t("pricing_section.commission_structure.block1.text"),
            style: {
                background: "#f0fdf4",
                border: "1px solid #b9f8cf"
            }
        },
        {
            img: shield,
            title: t("pricing_section.commission_structure.block2.title"),
            desc: t("pricing_section.commission_structure.block2.text"),
            style: {
                background: "#fefce8",
                border: "1px solid #fff085"
            }
        },
        {
            img: time,
            title: t("pricing_section.commission_structure.block3.title"),
            desc: t("pricing_section.commission_structure.block3.text"),
            style: {
                background: "#eff6ff",
                border: "1px solid #bedbff"
            }
        },
    ]

    return (
        <div className={styles.main}>
            <h4 className={styles.title}>{t("pricing_section.commission_structure.title")}</h4>
            <div className={styles.blocks}>
                {blocks.map((item) => (
                    <BenefitsBlock img={item.img} title={item.title} desc={item.desc} style={item.style} />
                ))}
            </div>
        </div>
    )
}

export default Benefits