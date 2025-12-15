import React from 'react'

import styles from "./StatusUpdateSecond.module.scss"

const STATUSES = ["Processing", "Mark as shipped", "Shipped"];


const StatusUpdateSecond = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.track}>
                {STATUSES.map((status, i) => (
                    <React.Fragment key={status}>
                        <button className={styles.step}>{status}</button>

                        {i < STATUSES.length - 1 && (
                            <div className={styles.arrow} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

export default StatusUpdateSecond