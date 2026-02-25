import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from "./StatusUpdateSwitch.module.scss"
import { postOrderConfirm, postOrderShipped } from '../../../../api/seller/orders';
import { ErrToast } from '../../../Toastify';
import { useMediaQuery } from 'react-responsive';


const STATUSES_PEND = [
    {
        text: "Pending",
        value: "pending"
    },
    {
        text: "Confirm order",
        value: "confirm"
    },
    {
        text: "Processing",
        value: "processing"
    }
];

const stylesPending = {
    pending: {
        border: "1.20px solid #fff085",
        background: "#fefce8",
        color: "#a65f00"
    },
    confirm: {
        background: "#e47a00",
        color: "white",
        border: "1.20px solid #e47a00",
        cursor: "pointer"
    },
}

const STATUSES_PROC = [
    {
        text: "Processing",
        value: "processing"
    },
    {
        text: "Mark as shipped",
        value: "mark"
    },
    {
        text: "Shipped",
        value: "shipped"
    }
];

const stylesProc = {
    processing: {
        border: " 1.20px solid #ffd6a7",
        background: "#fff7ed",
        color: "#ca3500"
    },
    mark: {
        background: "#0070ff",
        color: "white",
        border: "1.20px solid #0070ff",
        cursor: "pointer"
    },
}

const StatusUpdateSwitch = ({ status, id, statusState, setStatusState, setLoading }) => {
    const [active, setActive] = useState(0);

    const wrapperRef = useRef(null);
    const trackRef = useRef(null);
    const stepRefs = useRef([]);

    const isMobile = useMediaQuery({ maxWidth: 600 })





    // useLayoutEffect(() => {
    //     if (isMobile) return;

    //     const wrapper = wrapperRef.current;
    //     const track = trackRef.current;
    //     const activeStep = stepRefs.current[active];

    //     if (!wrapper || !track || !activeStep) return;

    //     const wrapperCenter = wrapper.offsetWidth / 2;
    //     const stepCenter =
    //         activeStep.offsetLeft + activeStep.offsetWidth / 2;

    //     track.style.transform = `translateX(${wrapperCenter - stepCenter}px)`;
    // }, [active, isMobile]);




    const handleConfirm = async (btnStatus) => {

        if (btnStatus === "confirm") {
            setLoading(true)
            try {
                const res = await postOrderConfirm(id);

                if (res.status === 200) {
                    setLoading(false)
                    setStatusState("Processing")
                }
            } catch (error) {
                setLoading(false)
                const message =
                    error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Failed to confirm your order";

                ErrToast(message);
            }
        }

        if (btnStatus === "mark") {
            setLoading(true)
            try {
                const res = await postOrderShipped(id);

                if (res.status === 200) {
                    setLoading(false)
                    setStatusState("Shipped")
                }
            } catch (error) {
                setLoading(false)
                const message =
                    error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Failed to confirm your order";

                ErrToast(message);
            }
        }


    };

    const steps = statusState === "Pending" ? STATUSES_PEND : STATUSES_PROC;
    const stepStyles = statusState === "Pending" ? stylesPending : stylesProc;

    return (
        <div className={styles.wrapper}>
            <div className={styles.trackGrid}>
                <button
                    className={styles.step}
                    style={stepStyles[steps[0].value]}
                    onClick={() => handleConfirm(steps[0].value)}
                >
                    {steps[0].text}
                </button>

                <div className={styles.arrow} />

                <button
                    className={styles.step}
                    style={stepStyles[steps[1].value]}
                    onClick={() => handleConfirm(steps[1].value)}
                >
                    {steps[1].text}
                </button>

                <div className={styles.arrow} />

                <button
                    className={styles.step}
                    style={stepStyles[steps[2].value]}
                    onClick={() => handleConfirm(steps[2].value)}
                >
                    {steps[2].text}
                </button>
            </div>
        </div>
    );

}

export default StatusUpdateSwitch