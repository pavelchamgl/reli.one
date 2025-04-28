import { Modal } from "@mui/material"
import { useState } from "react"
import xIcon from "../../../assets/Payment/closeIcon.svg"

import styles from "./ConfirmYourAgeModal.module.scss"

const ConfirmYourAgeModal = ({ open, handleClose, setIsAdult }) => {
    return (
        <Modal
            open={open}
            onClose={handleClose}

        >
            <div className={styles.main}>
                <button onClick={handleClose} className={styles.closeBtn}>
                    <img src={xIcon} alt="" />
                </button>
                <div className={styles.content}>
                    <p>Confirm that you are 18 years of age</p>
                    <div className={styles.btnsWrap}>
                        <button onClick={() => setIsAdult(true)}>Yes</button>
                        <button onClick={handleClose}>No</button>
                    </div>
                </div>
            </div>

        </Modal>
    )
}

export default ConfirmYourAgeModal