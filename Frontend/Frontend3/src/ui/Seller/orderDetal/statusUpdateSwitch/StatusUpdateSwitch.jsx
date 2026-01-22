import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from "./StatusUpdateSwitch.module.scss"
import { postOrderConfirm, postOrderShipped } from '../../../../api/seller/orders';
import { ErrToast } from '../../../Toastify';
import { useMediaQuery } from 'react-responsive';


const STATUSES = ["Pending", "Processing", "Shipped"];

const StatusUpdateSwitch = ({ status, id }) => {
    const [active, setActive] = useState(0);

    const wrapperRef = useRef(null);
    const trackRef = useRef(null);
    const stepRefs = useRef([]);

    const isMobile = useMediaQuery({ maxWidth: 500 })



    useLayoutEffect(() => {
        if (!isMobile) {
            const wrapper = wrapperRef.current;
            const track = trackRef.current;
            const activeStep = stepRefs.current[active];

            if (!wrapper || !track || !activeStep) return;

            const wrapperCenter = wrapper.offsetWidth / 2;
            const stepCenter =
                activeStep.offsetLeft + activeStep.offsetWidth / 2;

            track.style.transform = `translateX(${wrapperCenter - stepCenter}px)`;
        }
    }, [active]);


    useEffect(() => {
        if (!status) return;

        const index = STATUSES.findIndex(item => item === status);
        if (index !== -1) {
            setActive(index);
        }
    }, [status]);

    const handleConfirm = async () => {
        try {
            const res = await postOrderConfirm(id);

            if (res.status === 200) {
                setActive(1)
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                "Failed to confirm your order";

            ErrToast(message);
        }
    };

    const handleShipped = async () => {
        try {
            const res = await postOrderShipped(id);

            if (res.status === 200) {
                setActive(2)
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                "Failed to ship the order";

            ErrToast(message);
        }
    };

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <div className={styles.track} ref={trackRef}>
                {STATUSES.map((status, i) => (
                    <div key={status} className={styles.block}>
                        <button
                            ref={(el) => (stepRefs.current[i] = el)}
                            className={`${styles.step} ${i === active ? styles.active : ""
                                }`}
                            onClick={() => {
                                if (i === 1) {
                                    handleConfirm()
                                }
                                if (i === 2) {
                                    handleShipped()
                                }
                            }}

                        >
                            {status}
                        </button>

                        {i < STATUSES.length - 1 && <div className={styles.arrow} />}
                    </div>
                ))}
            </div>
        </div>
    );

}

export default StatusUpdateSwitch