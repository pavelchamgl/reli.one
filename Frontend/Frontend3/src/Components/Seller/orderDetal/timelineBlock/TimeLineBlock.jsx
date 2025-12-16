import checkMark from "../../../../assets/Seller/orderDetal/checkMark.svg"
import clockIc from "../../../../assets/Seller/orderDetal/clock.svg"

import styles from "./TimelineBlock.module.scss"

const TimeLineBlock = ({ steps }) => {

    const timelineSteps = [
        {
            label: "Order created",
            date: "2025-11-26 16:45",
            completed: true,
        },
        {
            label: "Payment confirmed",
            date: "2025-11-26 16:47",
            completed: true,
        },
        {
            label: "Order acknowledged (Processing)",
            date: "2025-11-26 17:15",
            completed: true,
        },
        {
            label: "Shipment created",
            date: "2025-11-27 09:30",
            completed: true,
        },
        {
            label: "Tracking uploaded",
            date: "2025-11-27 09:32",
            completed: false,
        },
        {
            label: "Delivered",
            date: null,
            completed: false,
        },
    ];

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