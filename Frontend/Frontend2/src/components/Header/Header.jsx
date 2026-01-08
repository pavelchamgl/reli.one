import logo from "@/assets/headerAndFooter/logo.svg"
import { Link } from "react-router-dom"
import { useMediaQuery } from "react-responsive"
import { useState, useEffect } from "react"

import ChangeLang from "../changeLang/ChangeLang"

import burgerIc from "../../assets/headerAndFooter/burger.svg"
import closeIc from "../../assets/headerAndFooter/close.svg"

import styles from "./Header.module.scss"

const Header = () => {
  const isMobile = useMediaQuery({ maxWidth: 820 })
  const [open, setOpen] = useState(false)

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
            <li><Link to="/" onClick={closeMenu}>Home</Link></li>
            <li><Link to="/about" onClick={closeMenu}>About Us</Link></li>
            <li><Link to="/pricing-commission" onClick={closeMenu}>Commission Structure</Link></li>
            <li><Link to="/contact" onClick={closeMenu}>Contact</Link></li>
          </ul>
        </nav>

        <div className={styles.langAndStartWrap}>
          <ChangeLang />

          {!isMobile && (
            <button className={styles.startBtn}>
              Start Selling
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
