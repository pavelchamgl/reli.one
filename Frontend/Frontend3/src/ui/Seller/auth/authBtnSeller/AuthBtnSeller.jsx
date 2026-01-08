import styles from "./AuthBtnSeller.module.scss"

const AuthBtnSeller = ({ text, style, disabled, handleClick }) => {
    return (
        <>
            <button style={style} type="submit" className={styles.btn} disabled={disabled} onClick={handleClick}>
                {text}
            </button>
        </>
    )
}

export default AuthBtnSeller