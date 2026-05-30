import { useEffect, useRef } from "react";
import styles from "./CheckBox.module.scss";

const Checkbox = ({ checked, indeterminate = false, onChange, ...props }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        <label className={styles.selectLabel}>
            <input
                ref={inputRef}
                className={styles.selectInp}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                {...props}
            />
            <span></span>
        </label>
    );
};

export default Checkbox;
