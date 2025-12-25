import styles from "./TitleAndDesc.module.scss"

const TitleAndDesc = ({ title, desc }) => {
    return (
        <div className={styles.main}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.desc}>{desc}</p>
        </div>
    )
}

export default TitleAndDesc