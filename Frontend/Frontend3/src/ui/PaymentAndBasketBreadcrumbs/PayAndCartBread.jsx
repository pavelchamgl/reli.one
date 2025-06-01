
import { Link, useLocation, useNavigate } from "react-router-dom"

import arrRight from "../../assets/Payment/arrRight.svg"

import styles from "./PayAndCartBread.module.scss"
import { useMediaQuery } from "react-responsive"
import { useEffect, useState } from "react"

const PayAndCartBread = ({ section, setSection }) => {

    const [basketLink, setBasketLink] = useState("/basket")

    const [basketActive, setBasketActive] = useState(true)
    const [infoActive, setInfoActive] = useState(false)
    const [deliveryActive, setDeliveryActive] = useState(false)
    const [paymentActive, setPaymentActive] = useState(false)

    const isMobile = useMediaQuery({ maxWidth: 426 })

    const { pathname } = useLocation()

    const navigate = useNavigate()


    const handleLink = (isLink, step) => {
        if (isLink) {
            navigate(step)
        } else {
            setSection(step)
        }
    }

    useEffect(() => {
        if (isMobile) {
            setBasketLink("/mob_basket")
        } else {
            setBasketLink("/basket")
        }
    }, [isMobile])

    useEffect(() => {
        if (pathname === "/basket" || pathname === "/mob_basket") {
            setBasketActive(true)
            setInfoActive(false)
            setDeliveryActive(false)
            setPaymentActive(false)
        }
        if (pathname === "/payment" && section === 1) {
            setBasketActive(true)
            setInfoActive(true)
            setDeliveryActive(false)
            setPaymentActive(false)
        }
        if (section === 2) {
            setBasketActive(true)
            setInfoActive(true)
            setDeliveryActive(true)
            setPaymentActive(false)
        }
        if (section === 3) {
            setBasketActive(true)
            setInfoActive(true)
            setDeliveryActive(true)
            setPaymentActive(true)
        }
    }, [pathname, section])

    useEffect(() => {
        console.log(section);
        console.log(setSection);


    }, [section])



   return (
        <div className={styles.main}>
            <div>
                <button className={basketActive ? styles.buttonAcc : null} disabled={!basketActive} onClick={() => handleLink(true, basketLink)}>
                    Cart
                </button>
                <img src={arrRight} alt="" />
            </div>
            <div>
                <button className={infoActive ? styles.buttonAcc : null} disabled={!infoActive} onClick={() => setSection(1)}>
                    Information
                </button>
                <img src={arrRight} alt="" />
            </div>
            <div>
                <button className={deliveryActive ? styles.buttonAcc : null} disabled={!deliveryActive} onClick={() => setSection(2)}>
                    Delivery
                </button>
                <img src={arrRight} alt="" />
            </div>
            <button className={paymentActive ? styles.buttonAcc : null} disabled={!paymentActive} onClick={() => handleLink(false, 3)}>
                Payment
            </button>

        </div>
    )
}

export default PayAndCartBread