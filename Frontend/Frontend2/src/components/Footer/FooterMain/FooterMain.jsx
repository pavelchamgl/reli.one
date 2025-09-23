import Container from "../../Container/Container"
import FooterLinks from "../footerLinks/FooterLinks"
import StayUpdated from "../StayUpdated/StayUpdated"

import styles from "./FooterMain.module.scss"

const FooterMain = () => {
  return (
    <div className={styles.wrap}>
      <Container>
        <footer className={styles.main}>
          <FooterLinks />
          <StayUpdated />
        </footer>

      </Container>
    </div>
  )
}

export default FooterMain