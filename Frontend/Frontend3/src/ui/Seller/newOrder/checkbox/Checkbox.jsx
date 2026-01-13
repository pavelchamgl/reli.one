import styles from "./CheckBox.module.scss"

const Checkbox = ({ checked, onChange }) => {
    return (
        <label className={styles.selectLabel}>
            <input
                className={styles.selectInp}
                type="checkbox"
                checked={checked}
                onChange={onChange}

            />
            <span></span>
        </label>
    )
}

export default Checkbox