import styles from "./GoodsTub.module.scss"

const GoodsTub = ({ status, setStatus }) => {

    const handleTub = (text) => [
        setStatus(text)
    ]

    return (
        <div className={styles.main}>
            <button onClick={() => handleTub("active")} className={status === "active" ? styles.btnAct : styles.btnDef}>Active</button>
            <button onClick={() => handleTub("moder")} className={status === "moder" ? styles.btnAct : styles.btnDef}>On moderation</button>
            <button onClick={() => handleTub("notModer")} className={status === "notModer" ? styles.btnAct : styles.btnDef}>Not moderated</button>
        </div>
    )
}

export default GoodsTub