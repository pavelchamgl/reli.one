import Container from '../ui/Container/Container'

import styles from "../styles/NewPages.module.scss"

const PrivacyPolicyPage = () => {
    return (
        <Container>
            <div className={styles.main}>
                <h1>Privacy Policy</h1>
                <p>This is the privacy policy for Reli.one. We do not share your data with third parties. For more information, contact us at office@reli.one.</p>
            </div>

        </Container>
    )
}

export default PrivacyPolicyPage