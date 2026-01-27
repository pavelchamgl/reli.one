import logo from "@/assets/headerAndFooter/logo.svg"
import { Link, useNavigate } from "react-router-dom"
import { useMediaQuery } from "react-responsive"
import { useState, useEffect } from "react"

import ChangeLang from "../changeLang/ChangeLang"

import burgerIc from "../../assets/headerAndFooter/burger.svg"
import closeIc from "../../assets/headerAndFooter/close.svg"

import styles from "./Header.module.scss"
import { useTranslation } from "react-i18next"

const Header = () => {
  const isMobile = useMediaQuery({ maxWidth: 820 })
  const [open, setOpen] = useState(false)

  const navigate = useNavigate()

  const { t } = useTranslation("header")

  // блокируем скролл при открытом меню
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <header className={styles.header}>
      <div className={styles.main}>
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>

        <nav className={`${styles.navWrap} ${open ? styles.open : ""}`}>
          <ul>
            <li><Link to="/" onClick={closeMenu}>{t("home")}</Link></li>
            <li><Link to="/about" onClick={closeMenu}>{t("about")}</Link></li>
            <li><Link to="/pricing-commission" onClick={closeMenu}>{t("commission")}</Link></li>
            <li><Link to="/contact" onClick={closeMenu}>{t("contact")}</Link></li>
          </ul>
        </nav>

        <div className={styles.langAndStartWrap}>
          <ChangeLang />

          {!isMobile && (
            <button className={styles.startBtn} onClick={() => {
              window.location.href = "https://reli.one/seller/login"
            }
            }>
              {t("startSelling")}
            </button>
          )}

          {isMobile && (
            <button
              className={styles.burgerBtn}
              onClick={() => setOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              <img src={open ? closeIc : burgerIc} alt="" />
            </button>
          )}
        </div>
      </div>

      {/* затемнение фона */}
      {open && <div className={styles.overlay} onClick={closeMenu} />}
    </header>
  )
}

export default Header
