import { Modal } from "@mui/material"
import { useDispatch } from "react-redux"

import { fetchCreatePayPalSession, fetchCreateStripeSession } from "../../../redux/paymentSlice"

import xIcon from "../../../assets/Payment/closeIcon.svg"

import styles from "./ConfirmYourAgeModal.module.scss"

const ConfirmYourAgeModal = ({ open, handleClose, plataType }) => {

    const dispatch = useDispatch()

    const isNotAdult = () => {
        handleClose()
    }

    const isAdult = () => {
        if (plataType === "card") {
            dispatch(fetchCreateStripeSession());
            handleClose()
        } else {
            dispatch(fetchCreatePayPalSession());
            handleClose()
        }
    }


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
                        <button onClick={isAdult}>Yes</button>
                        <button onClick={isNotAdult}>No</button>
                    </div>
                </div>
            </div>

        </Modal>
    )
}

export default ConfirmYourAgeModal