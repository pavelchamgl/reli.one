import React, { useEffect, useRef, useState } from 'react'
import styles from "./StatusUpdateSwitch.module.scss"


const STATUSES = ["Processing", "Mark as shipped", "Shipped"];

const StatusUpdateSwitch = () => {
    const [active, setActive] = useState(1);

    const wrapperRef = useRef(null);
    const trackRef = useRef(null);
    const stepRefs = useRef([]);

  

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const track = trackRef.current;
        const activeStep = stepRefs.current[active];

        if (!wrapper || !track || !activeStep) return;

        const wrapperCenter = wrapper.offsetWidth / 2;
        const stepCenter =
            activeStep.offsetLeft + activeStep.offsetWidth / 2;

        const translateX = wrapperCenter - stepCenter;

        track.style.transform = `translateX(${translateX}px)`;
    }, [active]);

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <div className={styles.track} ref={trackRef}>
                {STATUSES.map((status, i) => (
                    <div key={status} className={styles.block}>
                        <button
                            ref={(el) => (stepRefs.current[i] = el)}
                            className={`${styles.step} ${i === active ? styles.active : ""
                                }`}
                            onClick={() => setActive(i)}
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