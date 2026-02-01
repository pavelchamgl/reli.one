import { Link } from 'react-router-dom';
import styles from './FormLink.module.scss';

const FormLink = ({ text, url }) => {
    return (
        <>
            <Link to={url} className={styles.link}>
                {text}
            </Link>
        </>
    )
}

export default FormLink