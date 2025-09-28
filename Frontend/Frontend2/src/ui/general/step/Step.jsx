import styles from "./Step.module.scss"

const Step = ({ num, image, color }) => {
    return (
        <div className={styles.main} style={{ backgroundColor: color }}>
            <img src={image} alt="" />
            <p className={styles.num} style={{ backgroundColor: color }}>{num}</p>
        </div>
    )
}

export default Step