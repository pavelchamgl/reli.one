import { useMediaQuery } from "react-responsive"

import styles from "./StatusText.module.scss"

const StatusText = ({ status }) => {

    const statuses = [
        {
            text: "Pending",
            bg: "#fefce8",
            color: "#a65f00",
            border: "#fff085"
        },
        {
            text: "Processing",
            bg: "#fff7ed",
            color: "#ca3500",
            border: "#ffd6a7"
        },
        {
            text: "Shipped",
            bg: "#eff6ff",
            color: "#1447e6",
            border: "#bedbff"
        },
        {
            text: "Delivered",
            bg: "#f0fdf4",
            color: "#008236",
            border: "#b9f8cf"
        },
        {
            text: "Cancelled",
            bg: "#fef2f2",
            color: "#c10007",
            border: "#ffc9c9"
        }
    ]

    const fStatus = statuses.find(st => st.text === status)

    const isMobile = useMediaQuery({ maxWidth: 500 })


    return (
        <div className={styles.status} style={{
            color: fStatus.color,
            backgroundColor: fStatus.bg,
            border: `1.2px solid ${fStatus.border}`,
            minWidth: isMobile ? "auto" : "129px"
        }}>
            {fStatus.text}
        </div>
    )
}

export default StatusText