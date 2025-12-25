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

    const blocks = [
        {
            img: dollar,
            title: "Low Commission per Sale",
            desc: "Commission up to 8% only",
            style: {
                background: "#f0fdf4",
                border: "1px solid #b9f8cf"
            }
        },
        {
            img: shield,
            title: "No setup Fees",
            desc: "What you see is what you pay",
            style: {
                background: "#fefce8",
                border: "1px solid #fff085"
            }
        },
        {
            img: time,
            title: "Monthly Payouts",
            desc: "Get paid every month, guaranteed",
            style: {
                background: "#eff6ff",
                border: "1px solid #bedbff"
            }
        },
    ]

    return (
        <div className={styles.main}>
            <h4 className={styles.title}>Commission Structure</h4>
            <div className={styles.blocks}>
                {blocks.map((item) => (
                    <BenefitsBlock img={item.img} title={item.title} desc={item.desc} style={item.style} />
                ))}
            </div>
        </div>
    )
}

export default Benefits