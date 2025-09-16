import moln from "../../../assets/whyChoose/moln.svg"


import styles from "./Benefits.module.scss"

const Benefits = ({ image, title, desc, style, posText }) => {
    return (
        <div className={styles.main}>
            <p className={styles.posText} style={style}>{posText}</p>
            <div className={styles.image} style={style}>
                <img src={image} alt="" />
            </div>
            <h4 className={styles.title}>{title}</h4>
            <p className={styles.desc}>{desc}</p>
        </div>
    )
}

export default Benefits