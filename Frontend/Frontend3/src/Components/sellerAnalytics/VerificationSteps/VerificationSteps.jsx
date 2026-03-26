
import greenMark from "../../../assets/sellerAnalyt/greenMark.svg"
import greyRadio from "../../../assets/sellerAnalyt/greyRadio.svg"

import styles from "./VerificationSteps.module.scss"


const CompletBlock = ({ text }) => {
    return (
        <div className={styles.completeBlock}>
            <img src={greenMark} alt="" />
            <p>{text}</p>
        </div>
    )
}

const NotCompleteBlock = ({ text }) => {
    return (
        <div className={styles.notCompleteBlock}>
            <div className={styles.notCompleteImageAndText}>
                <img src={greyRadio} alt="" />
                <div>
                    <p>{text}</p>
                    <span>Incomplete</span>
                </div>
            </div>
            <button>
                Continue
            </button>
        </div>
    )
}

const VerificationSteps = () => {

    const blocks = [
        {
            text: 'Personal Information',
            completed: true
        },
        {
            text: 'Address',
            completed: true
        },
        {
            text: 'Bank Account Details',
            completed: false
        },
        {
            text: 'Tax Information',
            completed: false
        },
        {
            text: 'Warehouse Addres',
            completed: false
        },
        {
            text: 'Return Address',
            completed: false
        }
    ]

    return (
        <div className={styles.verificationSteps}>
            <h3 className={styles.title}>Verification Steps</h3>

            <div className={styles.stepsWrap}>
                {
                    blocks.map((block) => {
                        if (block.completed) {
                            return (
                                <CompletBlock key={block.text} text={block.text} />
                            )
                        } else {
                            return (
                                <NotCompleteBlock key={block.text} text={block.text} />
                            )
                        }
                    })
                }
            </div>

        </div>
    )
}

export default VerificationSteps