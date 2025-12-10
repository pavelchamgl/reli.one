import styles from "./CheckBox.module.scss"

const Checkbox = () => {
    return (
        <label className={styles.selectLabel}>
            <input
                className={styles.selectInp}
                type="checkbox"
                // checked={selectAll}
                // onChange={handleChange}
            />
            <span></span>
        </label>
    )
}

export default Checkbox