import Container from '../ui/Container/Container'

import styles from "../styles/NewPages.module.scss"

const TermsPage = () => {
    return (
        <Container>
            <div className={styles.main}>
                <h1>Terms of Service</h1>
                <p>By using Reli.one, you agree to comply with our terms and not misuse our platform. Contact us at office@reli.one for any questions.</p>
            </div>

        </Container>
    )
}

export default TermsPage