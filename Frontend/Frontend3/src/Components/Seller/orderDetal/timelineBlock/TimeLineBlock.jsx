import { useEffect, useState } from "react";
import checkMark from "../../../../assets/Seller/orderDetal/checkMark.svg"
import clockIc from "../../../../assets/Seller/orderDetal/clock.svg"

import styles from "./TimelineBlock.module.scss"

const TimeLineBlock = ({ timeline }) => {

    const DEFAULT_STEPS = [
        { type: "order_created", label: "Order created" },
        { type: "payment_confirmed", label: "Payment confirmed" },
        { type: "order_acknowledged", label: "Order acknowledged (Processing)" },
        { type: "shipment_created", label: "Shipment created" },
        { type: "tracking_uploaded", label: "Tracking uploaded" },
        { type: "delivered", label: "Delivered" },
    ];

    const [timelineSteps, setTimelineSteps] = useState([]);



    useEffect(() => {
        if (!timeline || !Array.isArray(timeline)) return;

        const steps = DEFAULT_STEPS.map((step) => {
            const serverStep = timeline.find(
                (item) => item.type === step.type
            );

            return {
                label: step.label,
                date: serverStep?.created_at ?? null,
                completed: Boolean(serverStep),
            };
        });

        setTimelineSteps(steps);
    }, [timeline]);


    return (
        <div className={styles.timeline}>
            <h4 className={styles.title}>Timeline</h4>

            {timelineSteps.map((step, idx) => (
                <div
                    key={idx}
                    className={`${styles.item} ${step.completed ? styles.completed : ""}`}
                >
                    <div className={styles.icon}>
                        <img src={step.completed ? checkMark : clockIc} alt="" />
                    </div>

                    <div className={styles.content}>
                        <p className={styles.label}>{step.label}</p>

                        {step.date && (
                            <span className={styles.date}>{step.date}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TimeLineBlock