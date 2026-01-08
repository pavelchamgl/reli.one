import styles from "./FormWrap.module.scss"

const FormWrap = ({ children, style }) => {
    return (
        <div style={style} className={styles.main}>
            {children}
        </div>
    )
}

export default FormWrap