import Container from '../ui/Container/Container'

import styles from "../styles/NewPages.module.scss"





const DeleteMyDataPage = () => {
    return (
        <Container>
            <div className={styles.main}>
                <h1>Data Deletion Instructions</h1>
                <p>If you wish to delete your account and associated data, please contact office@reli.one or use the “Delete Account” option in your profile settings.</p>
            </div>

        </Container>
    )
}

export default DeleteMyDataPage