import { useRef, useState } from "react"
import arrow from "../../../assets/askedQuestions/arrow.svg"
import styles from "./Accordion.module.scss"

const Accordion = ({ title, text }) => {
    const [open, setOpen] = useState(false)
    const contentRef = useRef(null)

    return (
        <div className={styles.main}>
            <div className={styles.titleWrap} onClick={() => setOpen(!open)}>
                <h5>{title}</h5>
                <img
                    src={arrow}
                    alt=""
                    style={{
                        transform: open ? "rotate(90deg)" : "rotate(0)",
                        transition: "transform 0.3s ease"
                    }}
                />
            </div>

            <div
                ref={contentRef}
                className={styles.content}
                style={{
                    maxHeight: open ? contentRef.current?.scrollHeight + "px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.5s ease"
                }}
            >
                <p>
                    {text}
                </p>
            </div>
        </div>
    )
}

export default Accordion
