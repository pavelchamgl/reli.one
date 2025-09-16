import logo from "@/assets/headerAndFooter/logo.svg"

import styles from "./Header.module.scss"
import ChangeLang from "../changeLang/ChangeLang"

const Header = () => {
    return (
        <div className={styles.main}>
            <img src={logo} alt="" />
            <ChangeLang />
        </div>
    )
}

export default Header