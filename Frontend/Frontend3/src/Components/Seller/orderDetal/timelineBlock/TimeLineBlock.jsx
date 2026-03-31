import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import checkMark from "../../../../assets/Seller/orderDetal/checkMark.svg"
import clockIc from "../../../../assets/Seller/orderDetal/clock.svg"

import styles from "./TimelineBlock.module.scss"

const TimeLineBlock = ({ timeline }) => {

    const { t } = useTranslation('sellerOrder')

    const DEFAULT_STEPS = [
        { id: 0, type: "order_created", label: "orderCreated" },
        { id: 1, type: "payment_confirmed", label: "paymentConfirmed" },
        { id: 2, type: "order_acknowledged", label: "orderAcknowledged" },
        { id: 3, type: "shipment_created", label: "shipmentCreated" },
        { id: 4, type: "tracking_uploaded", label: "trackingUploaded" },
        { id: 5, type: "delivered", label: "delivered" },
    ];

    const [timelineSteps, setTimelineSteps] = useState([]);

    useEffect(() => {
        if (!timeline || !Array.isArray(timeline)) return;

        // находим последний выполненный шаг (по индексу)
        const lastCompletedIndex = Math.max(
            ...timeline
                .map((item) =>
                    DEFAULT_STEPS.findIndex((step) => step.type === item.type)
                )
                .filter((i) => i !== -1),
            -1
        );

        const steps = DEFAULT_STEPS.map((step, index) => {
            const serverStep = timeline.find(
                (item) => item.type === step.type
            );

            return {
                label: step.label, // если сделал как я советовал
                date: serverStep?.created_at ?? null,
                completed: index <= lastCompletedIndex,
            };
        });

        setTimelineSteps(steps);
    }, [timeline]);

    useEffect(() => {
        console.log(timelineSteps);

    }, [timelineSteps])


    return (
        <div className={styles.timeline}>
            <h4 className={styles.title}>{t('timeline')}</h4>

            {timelineSteps.map((step, idx) => (
                <div
                    key={idx}
                    className={`${styles.item} ${step.completed ? styles.completed : ""}`}
                >
                    <div className={styles.icon}>
                        <img src={step.completed ? checkMark : clockIc} alt="" />
                    </div>

                    <div className={styles.content}>
                        <p className={styles.label}>{t(step.label)}</p>

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