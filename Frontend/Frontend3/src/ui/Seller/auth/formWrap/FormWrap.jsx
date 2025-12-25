import styles from "./FormWrap.module.scss"

const FormWrap = ({ children }) => {
    return (
        <div className={styles.main}>
            {children}
        </div>
    )
}

export default FormWrap