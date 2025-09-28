import styles from "./MessageForm.module.scss"

const MessageForm = () => {
    return (
        <form className={styles.form}>
            <h5 className={styles.title}>Send us a Message</h5>

            <div className={styles.formContent}>
                <div className={styles.nameAndLast}>
                    <label className={styles.inpLabel}>
                        <p>First Name</p>
                        <input type="text" placeholder="Your first name" />
                    </label>
                    <label className={styles.inpLabel}>
                        <p>Last Name</p>
                        <input type="text" placeholder="Your last name" />
                    </label>
                </div>
                <label className={styles.inpLabel}>
                    <p>Email Address</p>
                    <input type="text" placeholder="your.email@example.com" />
                </label>
                <label className={styles.inpLabel}>
                    <p>Business Type</p>
                    <input type="text" placeholder="e.g., Electronics, Fashion, Home & Garden" />
                </label>
                <label className={styles.inpLabel}>
                    <p>Message</p>
                    <textarea placeholder="Tell us about your business and how we can help..."></textarea>
                </label>
                <button className={styles.subBtn}>
                    Send Message
                </button>

            </div>



        </form>
    )
}

export default MessageForm