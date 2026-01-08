
import mailIcon from "../../../assets/footerNew/mail.svg"

import styles from "./StayUpdated.module.scss"

const StayUpdated = () => {
    return (
        <div>
            <div className={styles.mainOne}>
                <div>
                    <h5 className={styles.title}>Stay Updated</h5>
                    <p className={styles.desc}>Get the latest seller tips, platform updates, and success stories delivered to your inbox.</p>
                </div>
                <div className={styles.inpWrap}>
                    <div>
                        <img src={mailIcon} alt="" />
                        <input type="text" placeholder="Enter your email" />
                    </div>
                    <button className={styles.subBtn}>
                        Subscribe
                    </button>

                </div>
            </div>
            <div className={styles.mainTwo}>
                <p>© 2026 Reli Group s.r.o. All rights reserved.</p>
                <p>Made with ❤ for sellers worldwide</p>
            </div>
        </div>
    )
}

export default StayUpdated