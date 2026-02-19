import Spinner from "../../../Spiner/Spiner"
import styles from "./AuthBtnSeller.module.scss"

const AuthBtnSeller = ({ text, style, disabled, handleClick, loading }) => {
    return (
        <>
            <button style={style} type="submit" className={styles.btn} disabled={disabled} onClick={handleClick}>
                {
                    loading ?
                        <Spinner /> :
                        text
                }
            </button>
        </>
    )
}

export default AuthBtnSeller