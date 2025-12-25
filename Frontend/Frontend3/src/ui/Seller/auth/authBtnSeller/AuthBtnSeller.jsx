import styles from "./AuthBtnSeller.module.scss"

const AuthBtnSeller = ({ text }) => {
    return (
        <>
            <button type="submit" className={styles.btn}>
                {text}
            </button>
        </>
    )
}

export default AuthBtnSeller