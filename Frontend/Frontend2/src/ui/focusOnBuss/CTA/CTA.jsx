import styles from "./CTA.module.scss"

const CTA = ({ image, text, color, bgColor, style }) => {
    return (
        <button className={styles.main} style={{ color: color, backgroundColor: bgColor, ...style }}>
            <img src={image} alt="" />
            <p>{text}</p>
        </button>
    )
}

export default CTA