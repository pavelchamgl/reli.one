import { Modal } from "@mui/material"
import { useDispatch } from "react-redux"

import { fetchCreatePayPalSession, fetchCreateStripeSession } from "../../../redux/paymentSlice"

import xIcon from "../../../assets/Payment/closeIcon.svg"

import styles from "./ConfirmYourAgeModal.module.scss"
import { useTranslation } from "react-i18next"

const ConfirmYourAgeModal = ({ open, handleClose, plataType }) => {

    const dispatch = useDispatch()

    const { t } = useTranslation()

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
                    <p>{t("payment_page.confirmMessage")}</p>
                    <div className={styles.btnsWrap}>
                        <button onClick={isAdult}>{t("payment_page.yes")}</button>
                        <button onClick={isNotAdult}>{t("payment_page.no")}</button>
                    </div>
                </div>
            </div>

        </Modal>
    )
}

export default ConfirmYourAgeModal