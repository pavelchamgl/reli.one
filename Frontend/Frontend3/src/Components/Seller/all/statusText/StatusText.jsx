import { useMediaQuery } from "react-responsive"

import styles from "./StatusText.module.scss"

const StatusText = ({ status, big }) => {

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
            color: fStatus.color ? fStatus.color : "#101828",
            backgroundColor: fStatus.bg ? fStatus.bg : "white",
            border: `1.2px solid ${fStatus.border ? fStatus.border : "#d1d5dc"}`,
            minWidth: isMobile ? "auto" : "129px",
            height: big ? "38px" : "30px"
        }}>
            {fStatus.text}
        </div>
    )
}

export default StatusText