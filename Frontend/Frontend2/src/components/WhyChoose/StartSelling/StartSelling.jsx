
import arrRight from "../../../assets/general/arrRightBtn.svg"
import Container from "../../Container/Container"

import styles from './StartSelling.module.scss'

const StartSelling = () => {
    return (
        <div className={styles.main}>
            <h5 className={styles.title}>Ready to start selling?</h5>
            <p className={styles.desc}>Join successful sellers who have already discovered the power of Reli.one. No commitments,
                no risks, just results.</p>
            <button className={styles.btn}>
                <p>Create Your Free Account</p>
                <img src={arrRight} alt="" />
            </button>
        </div>
    )
}

export default StartSelling