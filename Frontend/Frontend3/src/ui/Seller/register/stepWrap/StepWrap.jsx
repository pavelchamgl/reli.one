import styles from './StepWrap.module.scss';

const StepWrap = ({ step }) => {
    return (
        <p className={styles.main}>
            Step <span className={styles.num}>{step}</span> of <span className={styles.num}>6</span>
        </p>
    )
}

export default StepWrap