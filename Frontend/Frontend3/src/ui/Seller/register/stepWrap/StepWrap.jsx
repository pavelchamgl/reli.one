import styles from './StepWrap.module.scss';

const StepWrap = ({ step }) => {
    return (
        <span className={styles.main}>
            {`Step ${step} of 6`}
        </span>
    )
}

export default StepWrap