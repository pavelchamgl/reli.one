import styles from './FormLink.module.scss';

const FormLink = ({text}) => {
    return (
        <>
            <a href="#" className={styles.link}>
                {text}
            </a>
        </>
    )
}

export default FormLink