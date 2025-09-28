import logo from "@/assets/headerAndFooter/logo.svg"
import { Link } from "react-router-dom"

import styles from "./Header.module.scss"
import ChangeLang from "../changeLang/ChangeLang"

const Header = () => {
    return (
        <div className={styles.main}>
            <Link to={"/"}>
                <img src={logo} alt="" />
            </Link>
            <ChangeLang />
        </div>
    )
}

export default Header